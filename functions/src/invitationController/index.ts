import { Request, Response } from 'express';
import * as functions from 'firebase-functions';
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

const sendHelpMessage = (res: Response) => {
    res.status(200).send({
        text: `usage:
      - ${TriggerWord} ${Command.Add} [name] [count] [date]
        - name => 担当者名（MyPlaceに登録してある名前、スペースを除いて）
        - count => 招待人数
        - date => ex:) 2019-10-08
      - ${TriggerWord} ${Command.Help}
      - ${TriggerWord} ${Command.Usage}
    `,
        response_type: 'ephemeral',
    });
};

export const handler = functions
    .runWith({
        timeoutSeconds: 180,
        memory: '512MB',
    })
    .region('asia-northeast1')
    .https.onRequest(async (req: Request, res: Response) => {
        const reqBody: SlackRequestMessage = { ...req.body };
        if (reqBody.token !== functions.config().solainv.slack.outgoing_token) {
            throw new Error('Invalid token received');
        }

        const separated = reqBody.text.split(/\s+/);
        if (separated.length < 2) {
            sendHelpMessage(res);
            return;
        }
        separated.shift(); // this is must be solainv
        const command: CommandType = separated.shift();
        const args = separated;

        const actions = parseActions(command, args);

        switch (actions.action) {
            case Command.Add:
                res.send({ response_type: 'ephemeral' });
                const command = require('./commands/add')['default'];
                await command(actions);
                res.send({ response_type: 'ephemeral', text: 'たぶん送れた' });
                return;
            case Command.Help:
            case Command.Usage:
                sendHelpMessage(res);
                return;
        }
    });
