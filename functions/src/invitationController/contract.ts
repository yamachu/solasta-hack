export const VisitViewFormUrl =
    'https://visitview.knowlbo.co.jp/solasta-tenant/officeview/OfficeView.WebPages/VisitorBooking/VisitorBookingDataPage.aspx';

export const LinkToVisitView = '#rightside_scrollbox > div.visitview > a';
export const LinkToVisitViewForm = '#imageButton_NewVisitorBooking';

export const TriggerWord = 'solainv';

export interface SlackRequestMessage {
    token: string;
    channel_id: string;
    channel_name: string;
    user_id: string;
    user_name: string;
    text: string;
    trigger_word: string;
}

export const enum Command {
    Add = 'add',
    Usage = 'usage',
    Help = 'help',
}

export type CommandType = Command | string | undefined;

export type Actions =
    | {
          action: Command.Add;
          host: string;
          count: number;
          date: Date;
      }
    | {
          action: Command.Help;
      }
    | {
          action: Command.Usage;
      };
