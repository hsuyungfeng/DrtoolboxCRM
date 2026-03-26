import { Injectable } from "@nestjs/common";
import { TreatmentCourse } from "../entities/treatment-course.entity";

/**
 * 療程進度服務
 * 負責計算和報告療程進度
 * 進度從 sessions 完成狀態即時衍生，不單獨儲存
 *
 * Treatment Progress Service
 * Calculates and reports treatment course progress
 * Progress is derived in real-time from session completion status
 */
@Injectable()
export class TreatmentProgressService {
  /**
   * 計算療程進度百分比
   * Calculate treatment course progress percentage
   * @param course 療程，包含 sessions 關係 / Treatment course with sessions relation
   * @returns 0-100 的百分比 / 0-100 percentage
   */
  calculateProgressPercent(course: TreatmentCourse): number {
    if (!course.sessions || course.sessions.length === 0) {
      return 0;
    }

    const completedCount = course.sessions.filter(
      (session) => session.completionStatus === "completed",
    ).length;

    return Math.round((completedCount / course.sessions.length) * 100);
  }

  /**
   * 取得療程進度物件
   * Get treatment course progress object
   * @param course 療程 / Treatment course
   * @returns 包含進度詳情的物件 / Object containing progress details
   */
  getProgress(course: TreatmentCourse) {
    const completedCount =
      course.sessions?.filter((s) => s.completionStatus === "completed")
        .length || 0;
    const totalCount = course.sessions?.length || 0;

    return {
      totalSessions: totalCount,
      completedSessions: completedCount,
      pendingSessions: totalCount - completedCount,
      progressPercent: this.calculateProgressPercent(course),
      isCompleted: totalCount > 0 && completedCount === totalCount,
    };
  }

  /**
   * 確定療程是否已全部完成
   * Determine if treatment course is fully completed
   * @param course 療程 / Treatment course
   * @returns 是否完成 / Whether completed
   */
  isCourseFinallyCompleted(course: TreatmentCourse): boolean {
    if (!course.sessions || course.sessions.length === 0) {
      return false;
    }
    return course.sessions.every((s) => s.completionStatus === "completed");
  }

  /**
   * 批量計算多個療程進度
   * Batch calculate progress for multiple courses
   * @param courses 療程陣列 / Array of treatment courses
   * @returns 每個療程的進度資訊 / Progress info for each course
   */
  calculateProgressForCourses(courses: TreatmentCourse[]) {
    return courses.map((course) => ({
      courseId: course.id,
      progress: this.getProgress(course),
    }));
  }
}
