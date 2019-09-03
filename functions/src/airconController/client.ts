import fetch from 'node-fetch';
import { Floor, AirConditionerStatus, AirConditionerOperateStatus } from './contract';

class Client {
    private readonly host: string = 'https://myplace-app.com';
    token: string;

    constructor() {
        this.token = '---TOKEN---';
    }

    setToken(token: string) {
        this.token = token;
    }

    getFloorTemp(floor: Floor): Promise<AirConditionerStatus[]> {
        return fetch(`${this.host}/api/air_conditioners/floors/${floor}`, {
            method: 'GET',
            headers: {
                authorization: `Bearer ${this.token}`,
            },
        })
            .then((v) => v.json())
            .then((j) => j.data);
    }

    getAirConTemp(airConId: number): Promise<AirConditionerOperateStatus[]> {
        return fetch(`${this.host}/api/air_conditioners/${airConId}/operations`, {
            method: 'GET',
            headers: {
                authorization: `Bearer ${this.token}`,
            },
        })
            .then((v) => v.json())
            .then((j) => j.data);
    }
}

const client = new Client();

export default client;
