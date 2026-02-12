import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
} from "@nestjs/common";
import { StaffService } from "../services/staff.service";
import { CreateStaffDto } from "../dto/create-staff.dto";
import { UpdateStaffDto } from "../dto/update-staff.dto";

@Controller("staff")
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Post()
  create(@Body() createStaffDto: CreateStaffDto) {
    return this.staffService.create(createStaffDto);
  }

  @Get()
  findAll(@Query("clinicId") clinicId: string) {
    return this.staffService.findAll(clinicId);
  }

  @Get("role/:role")
  findByRole(@Query("clinicId") clinicId: string, @Param("role") role: string) {
    return this.staffService.findByRole(clinicId, role);
  }

  @Get("search")
  searchByName(
    @Query("clinicId") clinicId: string,
    @Query("name") name: string,
  ) {
    return this.staffService.searchByName(clinicId, name);
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.staffService.findOne(id);
  }

  @Put(":id")
  update(@Param("id") id: string, @Body() updateStaffDto: UpdateStaffDto) {
    return this.staffService.update(id, updateStaffDto);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.staffService.remove(id);
  }
}
