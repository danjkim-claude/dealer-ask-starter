import bcrypt from "bcryptjs";
export function hashPassword(p: string): string { return bcrypt.hashSync(p, 10); }
export function checkPassword(p: string, hash: string | null | undefined): boolean { return !!hash && bcrypt.compareSync(p, hash); }
