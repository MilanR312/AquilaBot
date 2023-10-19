import {Result} from "../types/result/result";

export interface IUser{

    get inSync(): boolean;
    get money(): number;
    get banned(): boolean;

    setBanned(banned:boolean): Promise<Result<void,number>>
    changeMoney(earned:number): Promise<Result<void,number>>
    pull(): Promise<Result<void,number>>
    push(): Promise<Result<void, number>>
}