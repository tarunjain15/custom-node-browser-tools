export enum PageActionType {
  GOTO = 'goto',
  CLICK = 'click',
  TEXT_INPUT = 'textInput',
  WAIT_FOR_SELECTOR = 'waitForSelector',
  SCREENSHOT = 'screenshot',
  GET_HTML = 'getHtml',
  GET_TEXT = 'getText',
}

export enum SelectorType {
  CSS = 'css',
  XPATH = 'xpath',
}

export interface WaitOptions {
  timeout?: number;
  visible?: boolean;
  hidden?: boolean;
}

export interface TypeOptions {
  delay?: number;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
  outputFieldName?: string;
  encoding?: 'binary' | 'base64';
}

export interface HtmlOptions {
  selector?: string;
  selectorType?: SelectorType;
  includeOuterHTML?: boolean;
}

export interface TextOptions {
  trim?: boolean;
}

export interface PageActionInputs {
  type: PageActionType;
  url?: string;
  selectorType?: SelectorType;
  selector?: string;
  waitOptions?: WaitOptions;
  text?: string;
  typeOptions?: TypeOptions;
  screenshotOptions?: ScreenshotOptions;
  htmlOptions?: HtmlOptions;
  textOptions?: TextOptions;
}