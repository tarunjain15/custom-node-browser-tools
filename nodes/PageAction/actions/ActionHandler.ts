import type { PageActionExecutor } from '.';
import type { PageActionInputs } from '../types';

export abstract class ActionHandler {
  abstract type: string;
  abstract execute(
    executor: Pick<PageActionExecutor, 'createError' | 'results'>,
    actionInputs: PageActionInputs,
  ): Promise<void>;
}