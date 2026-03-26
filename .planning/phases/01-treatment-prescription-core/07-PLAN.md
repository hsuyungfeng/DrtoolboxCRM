---
phase: 01-treatment-prescription-core
plan: 07
type: execute
wave: 2
depends_on: [01, 02, 03]
files_modified:
  - backend/src/treatments/dto/dto-validators.ts
  - backend/src/patients/dto/patient-validators.ts
  - backend/src/common/filters/validation-error.filter.ts
autonomous: true
requirements: []
must_haves:
  truths:
    - 所有 API 輸入都被驗證
    - 無效輸入返回明確錯誤訊息
    - 驗證規則一致應用於所有端點
  artifacts:
    - path: backend/src/treatments/dto/dto-validators.ts
      provides: 醫令和療程驗證規則
      contains: "export"
    - path: backend/src/common/filters/validation-error.filter.ts
      provides: 統一驗證錯誤處理
      contains: "ExceptionFilter"

---

<objective>
建立統一的 DTO 驗證層和全域異常過濾器，確保所有 API 輸入驗證一致且錯誤訊息清晰。

**Purpose:**
保護系統免受無效輸入，提供清晰的用戶反饋。

**Output:**
DTO 驗證器、ValidationErrorFilter。
</objective>

<execution_context>
@.planning/codebase/STACK.md
@.planning/phases/01-treatment-prescription-core/01-RESEARCH.md
</execution_context>

<context>
## 驗證框架

- class-validator：DTO 級別驗證
- ExceptionFilter：全域異常處理

## 驗證規則

醫令：藥物名稱（必填、<=200），劑量（必填、<=100），療程數（必填、>0）
療程：名稱（必填、<=200），費用（>0），療程數（>0）
患者：身份證ID（必填、唯一），姓名（必填）
</context>

<tasks>

<task type="auto">
  <name>任務 1：建立統一驗證規則和 ValidationErrorFilter</name>
  <files>
    - backend/src/treatments/dto/dto-validators.ts
    - backend/src/patients/dto/patient-validators.ts
    - backend/src/common/filters/validation-error.filter.ts
  </files>

  <read_first>
    - backend/src/treatments/dto/create-medical-order.dto.ts
    - backend/src/treatments/dto/create-treatment-course.dto.ts
  </read_first>

  <action>
1. **dto-validators.ts** - 建立驗證常數和自訂驗證器

```typescript
export const VALIDATION_RULES = {
  MEDICAL_ORDER: {
    药物名稱: { min: 1, max: 200 },
    劑量: { min: 1, max: 100 },
    使用方式: { min: 1, max: 100 },
    療程數: { min: 1, max: 1000 },
  },
  TREATMENT_COURSE: {
    名稱: { min: 1, max: 200 },
    費用: { min: 0.01 },
    療程數: { min: 1, max: 1000 },
  },
  PATIENT: {
    idNumber: { min: 1, max: 50 },
    名稱: { min: 1, max: 100 },
    phoneNumber: { pattern: /^[0-9\-\+\(\)]+$/ },
    email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ },
  },
};

export function validateMedicalOrder(dto: any) {
  const errors = [];
  if (!dto.藥物或治療名稱 || dto.藥物或治療名稱.length > 200) {
    errors.push('藥物名稱必填，最多 200 字');
  }
  if (!dto.劑量 || dto.劑量.length > 100) {
    errors.push('劑量必填，最多 100 字');
  }
  if (!Number.isInteger(dto.療程數) || dto.療程數 <= 0) {
    errors.push('療程數必須是正整數');
  }
  return errors;
}
```

2. **validation-error.filter.ts** - 全域異常過濾器

```typescript
import { ExceptionFilter, Catch, ArgumentsHost, BadRequestException } from '@nestjs/common';

@Catch(BadRequestException)
export class ValidationErrorFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost) {
    const response = host.switchToHttp().getResponse();
    const exceptionResponse = exception.getResponse();

    const status = exception.getStatus();
    const message =
      typeof exceptionResponse === 'object'
        ? (exceptionResponse as any).message
        : exceptionResponse;

    response.status(status).json({
      statusCode: status,
      message: Array.isArray(message)
        ? message.join('; ')
        : message || 'Bad Request',
      timestamp: new Date().toISOString(),
    });
  }
}
```

在 main.ts 中註冊：
```typescript
app.useGlobalFilters(new ValidationErrorFilter());
```

設計：
- VALIDATION_RULES：集中驗證規則常數
- validateMedicalOrder：自訂驗證邏輯
- ValidationErrorFilter：統一異常格式，返回清晰訊息
  </action>

  <verify>
    - [ ] 檔案存在：test -f backend/src/treatments/dto/dto-validators.ts
    - [ ] 檔案存在：test -f backend/src/common/filters/validation-error.filter.ts
    - [ ] VALIDATION_RULES 包含規則：grep -q "VALIDATION_RULES" backend/src/treatments/dto/dto-validators.ts
    - [ ] ExceptionFilter 實作：grep -q "catch(exception" backend/src/common/filters/validation-error.filter.ts
  </verify>

  <done>
- 驗證規則已集中定義
- 全域異常過濾器已實現
  </done>
</task>

</tasks>

<verification>
**驗證驗證：**
- 無效醫令數據返回錯誤
- 療程數必須 > 0
- 身份證ID 必填

**錯誤訊息驗證：**
- 返回清晰的中文訊息
- 包含時間戳
- 標準化格式
</verification>

<success_criteria>
- [ ] DTO 驗證器已建立
- [ ] ValidationErrorFilter 已實現
- [ ] 錯誤訊息標準化
- [ ] 所有端點都應用驗證
</success_criteria>

<output>
完成後請建立：`.planning/phases/01-treatment-prescription-core/07-SUMMARY.md`
</output>

