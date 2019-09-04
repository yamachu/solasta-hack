import { Request, Response } from 'express';
import admin from 'firebase-admin';
import * as functions from 'firebase-functions';
import api from './client';
import { Floor } from './contract';

if (process.env.LOCAL_DEV !== undefined) {
    admin.initializeApp();
}

interface SlackRequestMessage {
    token: string;
    channel_id: string;
    channel_name: string;
    user_id: string;
    user_name: string;
    text: string;
    trigger_word: string;
}

const enum Command {
    ShowTemp = 'show_temp',
    List = 'list',
    Usage = 'usage',
    Help = 'help',
}

type CommandType = Command | string | undefined;

type Actions =
    | {
          action: Command.ShowTemp;
          floor: Floor;
          target: number;
      }
    | {
          action: Command.List;
          floor: Floor;
      }
    | {
          action: Command.Help;
      }
    | {
          action: Command.Usage;
      };

const parseActions = (command: CommandType, args: string[]): Actions => {
    switch (command) {
        case Command.List: {
            if (args.length === 0) {
                return {
                    action: Command.Usage,
                };
            }
            const floor = parseInt(args[0]);
            if (floor !== 15 && floor !== 16 && floor !== 17) {
                return {
                    action: Command.Usage,
                };
            }
            return {
                action: Command.List,
                floor: floor as Floor,
            };
        }
        case Command.ShowTemp: {
            if (args.length < 2) {
                return {
                    action: Command.Usage,
                };
            }
            const floor = parseInt(args[0]);
            const aircon_id = parseInt(args[1]);
            if (floor !== 15 && floor !== 16 && floor !== 17) {
                return {
                    action: Command.Usage,
                };
            }
            if (aircon_id === undefined) {
                return {
                    action: Command.Usage,
                };
            }
            return {
                action: Command.ShowTemp,
                floor: floor as Floor,
                target: aircon_id,
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
    res.status(200).send(`usage:
      - aircon list [floor]
        - floor => 15, 16, 17
      - aircon show_temp [floor] [aircon_id]
        - floor => 15, 16, 17
        - aircon_id => 400
    `);
};

const myHttpHandler = functions
    .region('asia-northeast1')
    .https.onRequest(async (req: Request, res: Response) => {
    const reqBody: SlackRequestMessage = { ...req.body };

    const separated = reqBody.text.split(/\s+/);
    if (separated.length < 2) {
        sendHelpMessage(res);
        return;
    }
    separated.shift(); // this is must be aircon
    const command: CommandType = separated.shift();
    const args = separated;

    const actions = parseActions(command, args);

    const config = await admin
        .firestore()
        .doc('/admin/token')
        .get();
    const token = config.get('accessToken');

    switch (actions.action) {
        case Command.ShowTemp: {
            api.setToken(token);
            const status = await api.getFloorTemp(actions.floor);
            const aircon = status.find((s) => s.id === actions.target.toString());
            if (aircon === undefined) {
                sendHelpMessage(res);
                return;
            }
            res.send(
                `id: ${aircon.id} => ${aircon.attributes.name}, 電源: ${aircon.attributes.is_power}, 設定: ${aircon.attributes.setting}℃, 室温: ${aircon.attributes.temperature}℃`
            );
            return;
        }
        case Command.List: {
            api.setToken(token);
            const status = await api.getFloorTemp(actions.floor);
            res.send(
                status
                    .map(
                        (v) =>
                            `id: ${v.id} => ${v.attributes.name}, 電源: ${v.attributes.is_power}, 設定: ${v.attributes.setting}℃, 室温: ${v.attributes.temperature}℃`
                    )
                    .join('\n')
            );
            return;
        }
        case Command.Help:
        case Command.Usage:
            sendHelpMessage(res);
            return;
    }
});

export default myHttpHandler;
