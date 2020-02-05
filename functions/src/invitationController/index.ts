import { Request, Response } from 'express';
import * as functions from 'firebase-functions';
import fetch, { Headers } from 'node-fetch';
import { Actions, Command, CommandType, SlackRequestMessage, TriggerWord } from './contract';

const parseActions = (command: CommandType, args: string[]): Actions => {
    switch (command) {
        case Command.Add: {
            if (args.length < 3) {
                return {
                    action: Command.Usage,
                };
            }
            const host = args[0];
            const count = parseInt(args[1], 10);
            const date = new Date(Date.parse(args[2]));
            if (date === undefined) {
                return {
                    action: Command.Usage,
                };
            }
            return {
                action: Command.Add,
                host,
                count,
                date,
            };
        }
        case Command.Help:
            return {
                action: Command.Help,
            };
        case Command.Usage:
            return {
                action: Command.Usage,
            };
        default:
            return {
                action: Command.Usage,
            };
    }
};

const helpMessage = `usage:
- ${TriggerWord} ${Command.Add} [name] [count] [date]
  - name => 担当者名（MyPlaceに登録してある名前、スペースを除いて）
  - count => 招待人数
  - date => ex:) 2019-10-08
- ${TriggerWord} ${Command.Help}
- ${TriggerWord} ${Command.Usage}
`;

const sendSlackOnlyVisibleYouMessage = (slackPayload: SlackRequestMessage, text: string) => {
    const body = JSON.stringify({
        channel: slackPayload.channel_id,
        text,
        user: slackPayload.user_id,
    });

    return fetch('https://slack.com/api/chat.postEphemeral', {
        method: 'POST',
        body,
        headers: new Headers([
            ['Authorization', `Bearer ${functions.config().solainv.slack.oauth_token}`],
            ['content-type', 'application/json'],
        ]),
    });
};

export const handler = functions
    .runWith({
        timeoutSeconds: 180,
        memory: '1GB',
    })
    .region('asia-northeast1')
    .https.onRequest(async (req: Request, res: Response) => {
        const reqBody: SlackRequestMessage = { ...req.body };
        if (reqBody.token !== functions.config().solainv.slack.outgoing_token) {
            throw new Error('Invalid token received');
        }
        if (reqBody.channel_name === '_timeline') {
            console.log('this action has sent by _timeline, ignore');
            res.status(200).send();
            return;
        }

        const separated = reqBody.text.split(/\s+/);
        if (separated.length < 2) {
            sendSlackOnlyVisibleYouMessage(reqBody, helpMessage);
            return;
        }
        separated.shift(); // this is must be solainv
        const command: CommandType = separated.shift();
        const args = separated;

        const actions = parseActions(command, args);

        switch (actions.action) {
            case Command.Add:
                // 200返すとpuppeteer落ちるな−
                // res.status(200).send();
                const command = require('./commands/add')['default'];
                try {
                await command(actions);
                await sendSlackOnlyVisibleYouMessage(
                    reqBody,
                    `${actions.host}のお客様を招待者として入館証のQRを発行しました。メールをご確認ください。`
                );
                } catch (e) {
                    console.error(e);
                    await sendSlackOnlyVisibleYouMessage(
                        reqBody,
                        `入館証のQR発行に失敗しました。リトライしてください。再度試してこのエラーが表示された場合は@yamachuにご連絡下さい。`
                    );
                }
                return;
            case Command.Help:
            case Command.Usage:
                res.status(200).send();
                await sendSlackOnlyVisibleYouMessage(reqBody, helpMessage);
                return;
        }
    });
