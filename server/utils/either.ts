interface EitherPattern<L, R, T> {
    left: (value: L) => T,
    right: (value: R) => T
}

export default class Either<L, R> {
    private readonly value: L|R;
    private constructor(value: L|R, private readonly isLeft: boolean) {
        this.value = value;
    }

    public static Left<L, R>(value: L) {
        return new Either<L, R>(value, true);
    }

    public static Right<L, R>(value: R) {
        return new Either<L, R>(value, false);
    }

    public caseOf<T>(p: EitherPattern<L, R, T>): T {
        if (this.isLeft) {
            return p.left(this.value as L);
        }
        return p.right(this.value as R);
    }

    public bind<T>(f: (r: R) => Either<L, T>) {
        if (this.isLeft) {
            return Either.Left<L, T>(this.value as L);
        }
        return f(this.value as R);
    }

    public async asyncBind<T>(f: (r: R) => Promise<Either<L, T>>) {
        if (this.isLeft) {
            return Either.Left<L, T>(this.value as L);
        }
        return await f(this.value as R);
    }
}
