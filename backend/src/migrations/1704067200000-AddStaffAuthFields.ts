import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class AddStaffAuthFields1704067200000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // 新增 username 欄位（唯一索引）
    await queryRunner.addColumn(
      'staff',
      new TableColumn({
        name: 'username',
        type: 'varchar',
        length: '255',
        isUnique: true,
        isNullable: true,
      }),
    );

    // 新增 passwordHash 欄位
    await queryRunner.addColumn(
      'staff',
      new TableColumn({
        name: 'passwordHash',
        type: 'varchar',
        length: '255',
        isNullable: true,
      }),
    );

    // 新增複合索引 (clinicId, username)
    await queryRunner.createIndex(
      'staff',
      new TableIndex({
        name: 'IDX_staff_clinic_username',
        columnNames: ['clinicId', 'username'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // 移除複合索引
    await queryRunner.dropIndex('staff', 'IDX_staff_clinic_username');

    // 移除 passwordHash 欄位
    await queryRunner.dropColumn('staff', 'passwordHash');

    // 移除 username 欄位
    await queryRunner.dropColumn('staff', 'username');
  }
}
