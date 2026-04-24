export class Transaction {
  public fromAddress: string | null;
  public toAddress: string;
  public amount: number;

  /**
   * @param fromAddress The sender's address. Can be null for mining rewards.
   * @param toAddress The recipient's address.
   * @param amount The number of coins being sent.
   */
  constructor(fromAddress: string | null, toAddress: string, amount: number) {
    this.fromAddress = fromAddress;
    this.toAddress = toAddress;
    this.amount = amount;
  }
}
