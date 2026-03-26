---
phase: 01-treatment-prescription-core
plan: 04
type: execute
wave: 2
depends_on: [01, 02, 03]
files_modified:
  - backend/src/treatments/controllers/medical-order.controller.ts
  - backend/src/treatments/services/medical-order.service.ts
  - backend/src/treatments/dto/medical-order-response.dto.ts
autonomous: true
requirements: [SCRIPT-01, SCRIPT-02, SCRIPT-03]
must_haves:
  truths:
    - 醫師能創建醫令（通過 API）
    - 系統能追蹤醫令使用狀態
    - 患者能查看已開立的醫令
  artifacts:
    - path: backend/src/treatments/services/medical-order.service.ts
      provides: 醫令業務邏輯
      contains: "createMedicalOrder"
    - path: backend/src/treatments/controllers/medical-order.controller.ts
      provides: 醫令 API 端點
      contains: "@Post()" 和 "@Get()"
  key_links:
    - from: medical-order.controller.ts
      to: medical-order.service.ts
      via: 依賴注入
      pattern: "constructor.*MedicalOrderService"
    - from: medical-order.service.ts
      to: medical-order.entity.ts
      via: 資料庫持久化
      pattern: "@InjectRepository.*MedicalOrder"

---

<objective>
實現醫令（Medical Order/Prescription）的 CRUD API 和業務邏輯，支持醫令創建、狀態追蹤、患者查詢。

**Purpose:**
醫師需要通過系統創建醫令，患者需要查看已開立的醫令和使用進度。

**Output:**
MedicalOrderService（業務邏輯）、MedicalOrderController（API 端點）、ResponseDTO（返回格式）。
</objective>

<execution_context>
@/home/hsu/.claude/get-shit-done/workflows/execute-plan.md
@.planning/codebase/STACK.md
@.planning/codebase/ARCHITECTURE.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 醫令服務架構

根據 RESEARCH.md 架構模式：
- Service 層：業務邏輯、狀態轉換驗證、事務處理
- Controller 層：HTTP 端點、輸入驗證（DTO）、響應格式化
- 多租戶：所有查詢都過濾 clinicId

## API 設計

醫令 API 端點：
- POST /api/medical-orders - 建立醫令
- GET /api/medical-orders/:id - 取得醫令詳情
- PATCH /api/medical-orders/:id - 更新醫令（包括狀態轉換）
- GET /api/patients/:patientId/medical-orders - 取得患者醫令列表
- DELETE /api/medical-orders/:id - 刪除醫令（可選，或標記為取消）

## 狀態轉換規則

pending → in_progress → completed/cancelled
- 只有醫師可以創建（pending）
- 醫師可以轉換為 in_progress 或 cancelled
- 患者可以標記為 completed（使用完畢）
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立 MedicalOrderService</name>
  <files>backend/src/treatments/services/medical-order.service.ts</files>

  <read_first>
    - backend/src/treatments/entities/medical-order.entity.ts
    - backend/src/treatments/services/treatment-course.service.ts
    - backend/src/treatments/dto/create-medical-order.dto.ts
    - backend/src/treatments/dto/update-medical-order.dto.ts
  </read_first>

  <action>
建立 MedicalOrderService 包含完整 CRUD 和狀態管理邏輯：

```typescript
import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MedicalOrder } from '@/treatments/entities/medical-order.entity';
import { ScriptTemplate } from '@/treatments/entities/script-template.entity';
import { CreateMedicalOrderDto } from '@/treatments/dto/create-medical-order.dto';
import { UpdateMedicalOrderDto } from '@/treatments/dto/update-medical-order.dto';
import { Patient } from '@/patients/entities/patient.entity';

@Injectable()
export class MedicalOrderService {
  // 定義狀態轉換規則
  private readonly validTransitions = {
    pending: ['in_progress', 'cancelled'],
    in_progress: ['completed', 'cancelled'],
    completed: [],
    cancelled: [],
  };

  constructor(
    @InjectRepository(MedicalOrder)
    private medicalOrderRepository: Repository<MedicalOrder>,
    @InjectRepository(ScriptTemplate)
    private scriptTemplateRepository: Repository<ScriptTemplate>,
    @InjectRepository(Patient)
    private patientRepository: Repository<Patient>,
  ) {}

  /**
   * 建立新醫令
   */
  async createMedicalOrder(
    dto: CreateMedicalOrderDto,
    prescribedBy: string,
    clinicId: string,
  ): Promise<MedicalOrder> {
    // 驗證患者存在且屬於該診所
    const patient = await this.patientRepository.findOne({
      where: { id: dto.patientId, clinicId },
    });
    if (!patient) {
      throw new NotFoundException('患者不存在');
    }

    let orderData = { ...dto, prescribedBy, clinicId };

    // 如果提供了模板 ID，從模板複製欄位
    if (dto.scriptTemplateId) {
      const template = await this.scriptTemplateRepository.findOne({
        where: { id: dto.scriptTemplateId, clinicId },
      });
      if (!template) {
        throw new NotFoundException('醫令模板不存在');
      }

      // 使用模板的預設值（但 DTO 欄位優先）
      orderData = {
        ...orderData,
        劑量: dto.劑量 || template.預設劑量,
        使用方式: dto.使用方式 || template.預設使用方式,
        療程數: dto.療程數 || template.預設療程數,
      };
    }

    // 驗證療程數必須 > 0
    if (orderData.療程數 <= 0) {
      throw new BadRequestException('療程數必須大於 0');
    }

    const medicalOrder = this.medicalOrderRepository.create({
      ...orderData,
      status: 'pending',
      已使用數: 0,
      開始日期: null,
    });

    return this.medicalOrderRepository.save(medicalOrder);
  }

  /**
   * 取得醫令詳情
   */
  async getMedicalOrder(
    orderId: string,
    clinicId: string,
  ): Promise<MedicalOrder> {
    const order = await this.medicalOrderRepository.findOne({
      where: { id: orderId, clinicId },
      relations: ['patient', 'prescriber'],
    });

    if (!order) {
      throw new NotFoundException('醫令不存在');
    }

    return order;
  }

  /**
   * 更新醫令（含狀態轉換）
   */
  async updateMedicalOrder(
    orderId: string,
    dto: UpdateMedicalOrderDto,
    clinicId: string,
  ): Promise<MedicalOrder> {
    const order = await this.getMedicalOrder(orderId, clinicId);

    // 如果要轉換狀態，驗證轉換有效性
    if (dto.status && dto.status !== order.status) {
      if (!this.validTransitions[order.status].includes(dto.status)) {
        throw new BadRequestException(
          `無法從 ${order.status} 轉換到 ${dto.status}`,
        );
      }

      // 轉換時設定時間戳
      if (dto.status === 'in_progress') {
        order.開始日期 = order.開始日期 || new Date();
      } else if (dto.status === 'completed') {
        order.完成日期 = new Date();
      }

      order.status = dto.status;
    }

    // 更新其他欄位
    if (dto.藥物或治療名稱) order.藥物或治療名稱 = dto.藥物或治療名稱;
    if (dto.說明) order.說明 = dto.說明;
    if (dto.劑量) order.劑量 = dto.劑量;
    if (dto.使用方式) order.使用方式 = dto.使用方式;
    if (dto.療程數) order.療程數 = dto.療程數;
    if (typeof dto.已使用數 === 'number') {
      // 驗證已使用數不超過療程數
      if (dto.已使用數 > order.療程數) {
        throw new BadRequestException('已使用數不能超過療程數');
      }
      order.已使用數 = dto.已使用數;
    }

    return this.medicalOrderRepository.save(order);
  }

  /**
   * 取得患者的所有醫令（含狀態過濾）
   */
  async getPatientMedicalOrders(
    patientId: string,
    clinicId: string,
    status?: string,
  ): Promise<MedicalOrder[]> {
    const query = this.medicalOrderRepository
      .createQueryBuilder('mo')
      .where('mo.patientId = :patientId', { patientId })
      .andWhere('mo.clinicId = :clinicId', { clinicId });

    if (status) {
      query.andWhere('mo.status = :status', { status });
    }

    return query.orderBy('mo.createdAt', 'DESC').getMany();
  }

  /**
   * 刪除醫令（軟刪除或標記為取消）
   */
  async cancelMedicalOrder(
    orderId: string,
    clinicId: string,
  ): Promise<MedicalOrder> {
    const order = await this.getMedicalOrder(orderId, clinicId);

    if (order.status === 'completed') {
      throw new BadRequestException('已完成的醫令不能取消');
    }

    if (order.status === 'cancelled') {
      throw new BadRequestException('醫令已取消');
    }

    order.status = 'cancelled';
    return this.medicalOrderRepository.save(order);
  }

  /**
   * 記錄醫令使用進度
   */
  async recordMedicalOrderUsage(
    orderId: string,
    clinicId: string,
    usedCount: number,
  ): Promise<MedicalOrder> {
    const order = await this.getMedicalOrder(orderId, clinicId);

    if (order.status === 'cancelled' || order.status === 'completed') {
      throw new BadRequestException(`${order.status} 的醫令無法更新使用進度`);
    }

    if (usedCount > order.療程數 - order.已使用數) {
      throw new BadRequestException('使用數超過剩餘療程數');
    }

    // 自動轉換狀態
    if (order.status === 'pending' && usedCount > 0) {
      order.status = 'in_progress';
      order.開始日期 = new Date();
    }

    order.已使用數 += usedCount;

    // 全部使用完自動標記為完成
    if (order.已使用數 >= order.療程數) {
      order.status = 'completed';
      order.完成日期 = new Date();
    }

    return this.medicalOrderRepository.save(order);
  }

  /**
   * 計算醫令進度百分比
   */
  getProgressPercent(order: MedicalOrder): number {
    if (order.療程數 === 0) return 0;
    return Math.round((order.已使用數 / order.療程數) * 100);
  }
}
```

設計原則：
- validTransitions 定義有效的狀態轉換
- 狀態轉換時設定時間戳（開始日期、完成日期）
- 驗證所有相關實體存在（患者、模板）
- 支持模板複製快速創建醫令
- recordMedicalOrderUsage 支持增量更新使用進度
- 自動狀態轉換：首次使用時 pending → in_progress，完全使用時 → completed
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/services/medical-order.service.ts
    - [ ] 包含 createMedicalOrder 方法：grep -q "async createMedicalOrder" backend/src/treatments/services/medical-order.service.ts
    - [ ] 包含狀態轉換驗證：grep -q "validTransitions" backend/src/treatments/services/medical-order.service.ts
    - [ ] 包含 recordMedicalOrderUsage 方法：grep -q "async recordMedicalOrderUsage" backend/src/treatments/services/medical-order.service.ts
    - [ ] TypeScript 編譯無誤
  </verify>

  <done>
- MedicalOrderService 實作完整
- 包含完整 CRUD 操作
- 狀態轉換驗證和自動轉換邏輯
- 使用進度追蹤
  </done>
</task>

<task type="auto">
  <name>任務 2：建立 MedicalOrderController 和 API 端點</name>
  <files>backend/src/treatments/controllers/medical-order.controller.ts</files>

  <read_first>
    - backend/src/treatments/services/medical-order.service.ts
    - backend/src/treatments/dto/create-medical-order.dto.ts
    - backend/src/treatments/dto/update-medical-order.dto.ts
  </read_first>

  <action>
建立 MedicalOrderController 提供完整的 REST API：

```typescript
import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { ClinicContextGuard } from '@/common/guards/clinic-context.guard';
import { MedicalOrderService } from '@/treatments/services/medical-order.service';
import { CreateMedicalOrderDto } from '@/treatments/dto/create-medical-order.dto';
import { UpdateMedicalOrderDto } from '@/treatments/dto/update-medical-order.dto';

@ApiBearerAuth()
@ApiTags('Medical Orders')
@Controller('api/medical-orders')
@UseGuards(ClinicContextGuard)
export class MedicalOrderController {
  constructor(private readonly medicalOrderService: MedicalOrderService) {}

  /**
   * 建立新醫令
   * POST /api/medical-orders
   */
  @Post()
  async create(
    @Body() dto: CreateMedicalOrderDto,
    @Req() req: any,
  ) {
    const prescribedBy = req.user.id; // 從 JWT token 取得醫師 ID
    const clinicId = req.clinicId; // 從 ClinicContextGuard 取得

    const order = await this.medicalOrderService.createMedicalOrder(
      dto,
      prescribedBy,
      clinicId,
    );

    return {
      statusCode: 201,
      message: '醫令已建立',
      data: order,
    };
  }

  /**
   * 取得醫令詳情
   * GET /api/medical-orders/:id
   */
  @Get(':id')
  async findOne(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const order = await this.medicalOrderService.getMedicalOrder(id, req.clinicId);

    return {
      statusCode: 200,
      data: order,
    };
  }

  /**
   * 更新醫令
   * PATCH /api/medical-orders/:id
   */
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateMedicalOrderDto,
    @Req() req: any,
  ) {
    const order = await this.medicalOrderService.updateMedicalOrder(
      id,
      dto,
      req.clinicId,
    );

    return {
      statusCode: 200,
      message: '醫令已更新',
      data: order,
    };
  }

  /**
   * 取得患者的所有醫令
   * GET /api/patients/:patientId/medical-orders
   */
  @Get('patients/:patientId')
  async getPatientOrders(
    @Param('patientId') patientId: string,
    @Query('status') status?: string,
    @Req() req: any,
  ) {
    const orders = await this.medicalOrderService.getPatientMedicalOrders(
      patientId,
      req.clinicId,
      status,
    );

    return {
      statusCode: 200,
      data: orders,
      count: orders.length,
    };
  }

  /**
   * 記錄醫令使用
   * POST /api/medical-orders/:id/use
   */
  @Post(':id/use')
  async recordUsage(
    @Param('id') id: string,
    @Body() body: { usedCount: number },
    @Req() req: any,
  ) {
    const order = await this.medicalOrderService.recordMedicalOrderUsage(
      id,
      req.clinicId,
      body.usedCount,
    );

    return {
      statusCode: 200,
      message: '使用進度已記錄',
      data: order,
    };
  }

  /**
   * 取消醫令
   * DELETE /api/medical-orders/:id
   */
  @Delete(':id')
  async cancel(
    @Param('id') id: string,
    @Req() req: any,
  ) {
    const order = await this.medicalOrderService.cancelMedicalOrder(
      id,
      req.clinicId,
    );

    return {
      statusCode: 200,
      message: '醫令已取消',
      data: order,
    };
  }
}
```

設計：
- 所有端點都使用 @UseGuards(ClinicContextGuard) 確保多租戶隔離
- 從 req.user.id 取得當前使用者（醫師）ID
- 從 req.clinicId 取得診所 ID
- 標準化 API 響應格式（statusCode、message、data）
- 包含 Swagger 文檔裝飾器
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/controllers/medical-order.controller.ts
    - [ ] 包含 POST /api/medical-orders 端點：grep -q "@Post()" backend/src/treatments/controllers/medical-order.controller.ts
    - [ ] 包含 GET /api/medical-orders/:id 端點：grep -q "@Get(':id')" backend/src/treatments/controllers/medical-order.controller.ts
    - [ ] 包含 PATCH 更新端點：grep -q "@Patch" backend/src/treatments/controllers/medical-order.controller.ts
    - [ ] 包含 DELETE 取消端點：grep -q "@Delete" backend/src/treatments/controllers/medical-order.controller.ts
    - [ ] 使用 ClinicContextGuard：grep -q "@UseGuards(ClinicContextGuard)" backend/src/treatments/controllers/medical-order.controller.ts
  </verify>

  <done>
- MedicalOrderController 實作完整
- 包含所有 CRUD 端點
- 支持狀態轉換、使用進度記錄
- 多租戶隔離和認證檢查
  </done>
</task>

<task type="auto">
  <name>任務 3：建立 MedicalOrderResponseDto</name>
  <files>backend/src/treatments/dto/medical-order-response.dto.ts</files>

  <read_first>
    - backend/src/treatments/entities/medical-order.entity.ts
  </read_first>

  <action>
建立用於 API 響應的 DTO：

```typescript
import { Exclude } from 'class-transformer';

export class MedicalOrderResponseDto {
  id: string;
  clinicId: string;
  patientId: string;
  prescribedBy: string;
  藥物或治療名稱: string;
  說明?: string;
  劑量: string;
  使用方式: string;
  療程數: number;
  已使用數: number;
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
  開始日期?: Date;
  完成日期?: Date;
  createdAt: Date;
  updatedAt: Date;

  // 計算欄位
  progressPercent?: number;
  remainingCount?: number;
}

/**
 * 患者視圖 DTO（隱藏敏感資訊）
 */
export class MedicalOrderPatientViewDto {
  id: string;
  藥物或治療名稱: string;
  說明?: string;
  劑量: string;
  使用方式: string;
  療程數: number;
  已使用數: number;
  status: string;
  開始日期?: Date;
  完成日期?: Date;
  createdAt: Date;

  progressPercent?: number;
  remainingCount?: number;

  @Exclude()
  prescribedBy: string;

  @Exclude()
  clinicId: string;
}
```

設計：
- MedicalOrderResponseDto：完整醫令資訊（醫護人員視圖）
- MedicalOrderPatientViewDto：患者視圖，隱藏醫師 ID 和診所 ID
- 包含計算欄位 progressPercent 和 remainingCount
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/dto/medical-order-response.dto.ts
    - [ ] 包含 MedicalOrderResponseDto 類：grep -q "export class MedicalOrderResponseDto" backend/src/treatments/dto/medical-order-response.dto.ts
    - [ ] 包含 MedicalOrderPatientViewDto：grep -q "export class MedicalOrderPatientViewDto" backend/src/treatments/dto/medical-order-response.dto.ts
  </verify>

  <done>
- ResponseDto 定義完整
- 支持不同角色的資訊視圖
  </done>
</task>

</tasks>

<verification>
**API 端點驗證：**
- POST /api/medical-orders - 建立醫令成功返回 201
- GET /api/medical-orders/:id - 返回醫令詳情
- PATCH /api/medical-orders/:id - 更新和狀態轉換
- GET /api/patients/:patientId/medical-orders - 患者醫令列表
- POST /api/medical-orders/:id/use - 記錄使用進度
- DELETE /api/medical-orders/:id - 取消醫令

**狀態機驗證：**
- pending → in_progress / cancelled
- in_progress → completed / cancelled
- completed / cancelled：終態，無進一步轉換

**多租戶驗證：**
- 所有查詢都過濾 clinicId
- 無法跨診所存取醫令
</verification>

<success_criteria>
- [ ] MedicalOrderService 實作完整 CRUD
- [ ] MedicalOrderController 包含所有 REST 端點
- [ ] 狀態機驗證和自動轉換工作正確
- [ ] 使用進度追蹤和自動完成邏輯
- [ ] 多租戶隔離確保
- [ ] DTO 驗證和響應格式化
</success_criteria>

<output>
完成後請建立文件：
`.planning/phases/01-treatment-prescription-core/04-SUMMARY.md`

紀錄：
- 建立的服務：MedicalOrderService（CRUD、狀態管理、使用進度）
- 建立的控制器：MedicalOrderController（REST API）
- API 端點：POST、GET、PATCH、DELETE、POST :id/use
- 狀態機已實現：pending → in_progress → completed/cancelled
</output>

