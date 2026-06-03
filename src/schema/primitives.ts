import { Schema } from "effect";

export const AbsolutePath = Schema.brand("AbsolutePath")(Schema.String);
export type AbsolutePath = Schema.Schema.Type<typeof AbsolutePath>;

export const RelativePath = Schema.brand("RelativePath")(Schema.String);
export type RelativePath = Schema.Schema.Type<typeof RelativePath>;
