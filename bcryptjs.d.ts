declare module "bcryptjs" {
  const bcrypt: {
    compare(data: string, encrypted: string): Promise<boolean>;
  };

  export default bcrypt;
}
