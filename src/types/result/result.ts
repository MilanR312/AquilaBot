import { Optional, Some, None } from "../option/option";
export class Result<T,E> {
    _is_ok : boolean;
    value: T | E;
    constructor(is_ok: boolean, value: T|E){
        this._is_ok = is_ok;
        this.value = value
    }
    public clone(): Result<T,E> {
        return new Result<T,E>(this._is_ok, this.value);
    }
    public isOk(): boolean {
        return this._is_ok;
    }
    public isOkAnd(func: (v: T) => boolean): boolean {
       return this.isOk() && func(this.value as T);
    }
    public isErr(): boolean {
        return !this.isOk();
    }
    public isErrAnd(func: (v: E) => boolean): boolean {
        return this.isErr() && func(this.value as E);
    }
    public ok(): Optional<T>{
        if (this.isOk()){
            return Some(this.value as T);
        } else {
            return None();
        }
    }
    public err(): Optional<E> {
        if (this.isErr()){
            return Some(this.value as E);
        } else {
            return None();
        }
    }
    public map<U>(func: (val: T) => U): Result<U, E>{
        let value: U|E;
        let isok = this.isOk();
        if (this.isOk()){
            value = func(this.value as T)
        } else {
            value = this.value as E
        }
        return new Result<U,E>(isok, value);
    }
    public mapOr<U,F>(def: U, func: (val: T) => U): U{
        if (this.isOk()){
            return func(this.value as T);
        } else {
            return def;
        }
    }
    public mapOrElse<U>(f_err: (val:E) => U, f_val: (val: T) => U): U{
        if (this.isOk()){
            return f_val(this.value as T);
        } else {
            return f_err(this.value as E);
        }
    }
    public mapErr<F>(func: (val: E) => F): Result<T,F> {
        let value: T|F;
        let isok = this.isOk();
        if (isok){
            value = this.value as T;
        } else {
            value = func(this.value as E);
        }
        return new Result<T,F>(isok, value);
    }
    public expect(error_message: String): T {
        if (this.isOk()){
            return this.value as T;
        } else {
            throw new Error(`${error_message}\n${this.value as E}`)
        }
    }
    public unwrap(): T{
        if (this.isOk()){
            return this.value as T;
        } else {
            throw new Error(`unwrap of Err variant\n${this.value as E}`);
        }
    }
    public expectErr(error_message: String): E {
        if (this.isOk()){
            throw new Error(`${error_message}\n${this.value as T}`);
        } else {
            return this.value as E;
        }
    }
    public unwrapErr(error_message: String): E {
        if (this.isOk()){
            throw new Error(`unwrap of Ok variant\n${this.value as T}`);
        } else {
            return this.value as E;
        }
    }
    //and or logic here
    public unwrapOr(def: T): T {
        if (this.isOk()){
            return this.value as T;
        }
        return def;
    }
    public unwrapOrElse(func: (val: E) => T): T {
        if (this.isOk()){
            return this.value as T;
        } else {
            return func(this.value as E);
        }
    }
    public match<R>(func_ok: (v: T) => R, func_err: (v: E) => R ): R {
        return this.mapOrElse(func_err, func_ok);
    }
    
}
export function Ok<T,E>(value: T): Result<T, E>{
    return new Result<T,E>(true, value);
}
export function Err<T,E>(value: E): Result<T,E>{
    return new Result<T,E>(false, value);
}