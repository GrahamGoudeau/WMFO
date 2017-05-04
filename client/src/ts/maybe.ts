export interface MaybePattern<T, K> {
    just: (value: T) => K,
    nothing: () => K
}

export default class Maybe<T> {
    private constructor(private _isNothing: boolean, private value?: T) {};

    public static just<T>(value: T): Maybe<T> {
        return new Maybe(false, value);
    }

    public static nothing<T>(): Maybe<T> {
        return new Maybe<T>(true);
    }

    // TODO: I can't get typescript to be happy when I annotate the eq function
    public equals(rhs: Maybe<T>, eq: (lhsInner: T, rhsInner: T) => boolean): boolean {
        if (!this._isNothing && !rhs._isNothing) {
            return eq(this.value as T, rhs.value as T);
        } else if (this._isNothing && rhs._isNothing) {
            return true;
        } else {
            return false;
        }
    }

    public isNothing(): boolean {return this._isNothing;}
    public isJust(): boolean {return !this._isNothing;}

    public caseOf<K>(c: MaybePattern<T, K>): K {
        if (this._isNothing) {
            return c.nothing();
        }
        return c.just(this.value);
    }

    public bind<K>(f: (value: T) => Maybe<K>): Maybe<K> {
        if (this._isNothing) {
            return Maybe.nothing<K>();
        }
        return f(this.value);
    }

    public valueOr<K>(defaultVal: K): T|K {
        if (this._isNothing) {
            return defaultVal;
        }
        return this.value;
    }
}
