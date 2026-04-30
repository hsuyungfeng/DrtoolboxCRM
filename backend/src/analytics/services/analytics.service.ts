import { Injectable, Logger } from "@nestjs/common";
import { DataSource } from "typeorm";

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * 按自定義欄位對患者進行分組統計
   * Aggregates patients by a specific custom field key
   */
  async aggregatePatientsByCustomField(
    clinicId: string,
    fieldKey: string,
  ): Promise<any[]> {
    // 💡 注意：這裡使用 PostgreSQL 的 JSONB 語法
    // 如果是 SQLite，語法會不同 (json_extract)
    const dbType = this.dataSource.options.type;
    
    let query = "";
    if (dbType === "postgres") {
      query = `
        SELECT 
          "customFields"->>'${fieldKey}' as label, 
          COUNT(*) as count 
        FROM patients 
        WHERE "clinicId" = $1 
          AND "customFields" ? $2
        GROUP BY "customFields"->>'${fieldKey}'
        ORDER BY count DESC
      `;
    } else {
      // Fallback for SQLite
      query = `
        SELECT 
          json_extract(customFields, '$.${fieldKey}') as label, 
          COUNT(*) as count 
        FROM patients 
        WHERE clinicId = ? 
          AND json_extract(customFields, '$.${fieldKey}') IS NOT NULL
        GROUP BY label
        ORDER BY count DESC
      `;
    }

    try {
      return await this.dataSource.query(query, [clinicId, fieldKey]);
    } catch (error) {
      this.logger.error(`Error in aggregatePatientsByCustomField: ${error.message}`);
      return [];
    }
  }

  /**
   * 獲取自定義欄位的數值趨勢分析
   * (例如：某個數值型自定義欄位的平均值隨時間變化)
   */
  async getCustomFieldTrend(
    clinicId: string,
    fieldKey: string,
    period: 'day' | 'month' = 'month'
  ): Promise<any[]> {
    const dbType = this.dataSource.options.type;
    let dateTrunc = period === 'day' ? 'YYYY-MM-DD' : 'YYYY-MM';
    
    let query = "";
    if (dbType === "postgres") {
      query = `
        SELECT 
          to_char("createdAt", '${dateTrunc}') as date,
          AVG(CAST("customFields"->>'${fieldKey}' AS NUMERIC)) as value
        FROM patients
        WHERE "clinicId" = $1
          AND ("customFields"->>'${fieldKey}') IS NOT NULL
        GROUP BY date
        ORDER BY date ASC
      `;
    } else {
      // SQLite
      const sqliteFormat = period === 'day' ? '%Y-%m-%d' : '%Y-%m';
      query = `
        SELECT 
          strftime('${sqliteFormat}', createdAt) as date,
          AVG(CAST(json_extract(customFields, '$.${fieldKey}') AS NUMERIC)) as value
        FROM patients
        WHERE clinicId = ?
          AND json_extract(customFields, '$.${fieldKey}') IS NOT NULL
        GROUP BY date
        ORDER BY date ASC
      `;
    }

    try {
      return await this.dataSource.query(query, [clinicId]);
    } catch (error) {
      this.logger.error(`Error in getCustomFieldTrend: ${error.message}`);
      return [];
    }
  }
}
