export type Floor = 15 | 16 | 17;

export interface AirConditionerStatus {
  id: string;
  type: string; // "air_conditioner"
  attributes: {
    id: number;
    name: string;
    floor_number: Floor;
    x: number;
    y: number;
    is_power: boolean;
    setting: number;
    temperature: number;
    is_operable: boolean;
    is_nearest: boolean;
  };
}

export interface AirConditionerOperateStatus {
  id: string;
  type: string; // "air_conditioner_operation"
  attributes: {
    action_name: string;
    operation: string;
    value: number;
    created_at: string; // "2019-06-06 21:02:03 +0900"
    updated_at: string;
    floor_number: Floor;
    tenant_division_name: string;
    user_name: string;
  };
}
