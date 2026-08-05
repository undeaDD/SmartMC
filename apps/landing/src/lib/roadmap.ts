import { config } from './config';

export type MilestoneStatus = 'done' | 'in-progress' | 'planned';

export function statusForOrder(order: number): MilestoneStatus {
  if (order < config.currentMilestone) return 'done';
  if (order === config.currentMilestone) return 'in-progress';
  return 'planned';
}
