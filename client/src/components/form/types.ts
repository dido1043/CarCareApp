import type { Control, FieldPath, FieldValues } from 'react-hook-form';

/**
 * The control props every field takes.
 *
 * Forms here parse on submit — `useForm<Input, unknown, Output>` — because the
 * numeric fields hold strings while the user is typing. That gives the control
 * three type parameters rather than one, and fields thread the output type
 * through without ever needing to know what it is.
 */
export interface FieldControlProps<TFieldValues extends FieldValues, TTransformed> {
  control: Control<TFieldValues, unknown, TTransformed>;
  name: FieldPath<TFieldValues>;
}
