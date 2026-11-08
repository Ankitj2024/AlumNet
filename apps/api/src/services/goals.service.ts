import { AppError, ErrorCodes } from '@p11/shared';
import { GoalModel } from '../models/Goal.model.js';
import { ActionItemModel } from '../models/ActionItem.model.js';
import { MentorshipModel } from '../models/Mentorship.model.js';

export class GoalsService {
  async createGoal(
    userId: string,
    mentorshipId: string,
    data: {
      title: string;
      description?: string;
      category: any;
      targetDate: Date;
    }
  ) {
    const mentorship = await MentorshipModel.findById(mentorshipId);
    if (!mentorship || mentorship.status !== 'ACTIVE') {
      throw new AppError('Active mentorship required.', 400, ErrorCodes.BAD_REQUEST);
    }

    const goal = await GoalModel.create({
      mentorshipId,
      title: data.title,
      description: data.description,
      category: data.category,
      targetDate: data.targetDate,
      createdBy: userId as any,
      status: 'IN_PROGRESS',
      progressPercentage: 0,
    });

    mentorship.lastMeaningfulActivityAt = new Date();
    await mentorship.save();

    return goal;
  }

  async updateGoalProgress(goalId: string, progressPercentage: number) {
    const status = progressPercentage >= 100 ? 'COMPLETED' : 'IN_PROGRESS';
    const completedAt = progressPercentage >= 100 ? new Date() : undefined;

    const goal = await GoalModel.findByIdAndUpdate(
      goalId,
      {
        progressPercentage: Math.min(100, Math.max(0, progressPercentage)),
        status,
        completedAt,
      },
      { new: true }
    );

    if (!goal) {
      throw new AppError('Goal not found.', 404, ErrorCodes.NOT_FOUND);
    }

    return goal;
  }

  async createActionItem(
    userId: string,
    mentorshipId: string,
    goalId: string,
    data: {
      description: string;
      assignedTo: string;
      dueDate?: Date;
      priority?: any;
    }
  ) {
    const actionItem = await ActionItemModel.create({
      goalId,
      mentorshipId,
      description: data.description,
      assignedTo: data.assignedTo as any,
      dueDate: data.dueDate,
      priority: data.priority || 'MEDIUM',
      isCompleted: false,
    });

    return actionItem;
  }

  async toggleActionItem(actionItemId: string) {
    const item = await ActionItemModel.findById(actionItemId);
    if (!item) {
      throw new AppError('Action item not found.', 404, ErrorCodes.NOT_FOUND);
    }

    item.isCompleted = !item.isCompleted;
    item.completedAt = item.isCompleted ? new Date() : undefined;
    await item.save();

    // Auto-update parent goal progress based on completed items
    const allItems = await ActionItemModel.find({ goalId: item.goalId });
    if (allItems.length > 0) {
      const completed = allItems.filter((i) => i.isCompleted).length;
      const progress = Math.round((completed / allItems.length) * 100);
      await this.updateGoalProgress(item.goalId.toString(), progress);
    }

    return item;
  }

  async getMentorshipGoals(mentorshipId: string) {
    const goals = await GoalModel.find({ mentorshipId }).sort({ createdAt: -1 });
    const actionItems = await ActionItemModel.find({ mentorshipId });

    return goals.map((goal) => ({
      ...goal.toObject(),
      actionItems: actionItems.filter((i) => i.goalId.toString() === goal._id.toString()),
    }));
  }
}

export const goalsService = new GoalsService();

