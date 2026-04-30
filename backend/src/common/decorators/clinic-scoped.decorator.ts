import { SetMetadata } from '@nestjs/common';

export const CLINIC_SCOPED_KEY = 'clinic_scoped';
export const ClinicScoped = () => SetMetadata(CLINIC_SCOPED_KEY, true);
