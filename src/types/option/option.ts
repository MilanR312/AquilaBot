import { Result, Ok, Err } from "../result/result";
export class Optional<T> {
    _is_some : boolean;
    value: T | null;
    constructor(is_ok: boolean, value: T | null){
        this._is_some = is_ok;
        this.value = value
    }
    /**
     * 
     * @returns true if the option is Some
     */
    public isSome(): boolean {
        return this._is_some;
    }
    /**
     * 
     * @param f predicate to test Some variant against
     * @returns true if option is Some and the predicate returns true
     */
    public isSomeAnd(f: (v: T) => boolean) : boolean{
        return this.isSome() && f(this.value as T);
    }
    /**
     * 
     * @returns true if the option is None
     */
    public isNone(): boolean {
        return !this.isSome();
    }
    /**
     * 
     * @param error_message error message to put inside the exception
     * @returns the contained Some value or throws an error
     */
    public expect(error_message: String): T {
        if (this.isSome()){
            return this.value as T;
        } else {
            throw new Error(`${error_message}\n`)
        }
    }
    /**
     * 
     * @returns the contained Some value or throws an error
     */
    public unwrap(): T{
        if (this.isSome()){
            return this.value as T;
        } else {
            throw new Error(`unwrap of None variant`);
        }
    }
    /**
     * 
     * @param def default value
     * @returns value contained in Some or the provided default
     */
    public unwrapOr(def: T): T {
        if (this.isSome()){
            return this.value as T;
        }
        return def;
    }
    /**
     * 
     * @param func a function that will lazily compute a value when None
     * @returns the value contained by Some or the value calculate by the provided function
     */
    public unwrapOrElse(func: () => T) : T {
        if (this.isSome()){
            return this.value as T;
        } else {
            return func();
        }
    }
    /**
     * Maps an Optional<T> to Optional<U> by applying a function to a contained value (if Some) or return None (if None)
     */
    public map<U>(func: (v: T) => U): Optional<U>{
        let val: U | null = null;
        let is_some = this.isSome();
        if (is_some){
            val = func(this.value as T);
        }
        return new Optional(is_some, val);
    }
    /**
     * maps an Optional<T> to U by applying a function to the contained value (if Some) or return the passed default (if None)
     * @param def a given default value
     * @param func the function to map
     *
     */
    public mapOr<U>(def: U, func: (v: T) => U): U {
        if (this.isSome()){
            return func(this.value as T);
        } else {
            return def;
        }
    }
    /**
     * computes a default value (if None) or applies a different function to the contained value (if Some)
     * @param func_none function to calculate the default value
     * @param func_some function to map the Some variant
     * @returns the computed U value
     */
    public mapOrElse<U>(func_none: () => U, func_some: (v: T) => U): U{
        if (this.isSome()){
            return func_some(this.value as T);
        } else {
            return func_none();
        }
    }
    /**
     * transforms the Optional<T> to a Result<T,E> mapping Some(v) to Ok(b) and None to Err(err)
     * @param err value to be used inside the err variant
     * @returns Result<T,E>
     */
    public okOr<E>(err: E): Result<T,E>{
        if (this.isSome()){
            return Ok<T,E>(this.value as T);
        } else {
            return Err<T,E>(err);
        }
    }
    /**
     * transforms the Optional<T>to a Result<T,E> utilising
     * @param err_func to generate the error value laziliy
     * @returns 
     */
    public okOrElse<E>(err_func: () => E): Result<T,E>{
        if (this.isSome()){
            return Ok(this.value as T);
        } else {
            return Err(err_func());
        }
    }
    //and or funcs here
    /**
     * maps an Optional<T> to another Optional<T> where the value in the Some variant is optionaly transformed to None if it fails the given predicate
     * @param predicate 
     * @returns 
     */
    public filter(predicate: (v: T) => boolean): Optional<T>{
        if (this.isNone()){
            return None();
        }
        if (predicate(this.value as T)){
            return Some(this.value as T);
        } else {
            return None();
        }
    }
    /**
     * transforms an Optional<T> together with another Optional<U> into an Optional<{a:T, b:U}> if both are Some variants
     * @param other 
     * @returns 
     */
    public zip<U>(other: Optional<U>): Optional<{a: T, b: U}>{
        if (this.isSome() && other.isSome()){
            return Some({a: this.value as T, b: other.value as U});
        }
        return None();
    }

}
export function Some<T>(value: T): Optional<T>{
    return new Optional<T>(true, value);
}
export function None<T>(): Optional<T>{
    return new Optional<T>(false, null);
}