import { Inject, Service } from 'typedi';
import { MemoryDataSource } from '../db/memory';
import { EventDispatcher, EventDispatcherInterface } from '../decorators';
import { Coin } from './Coin';
import { events } from './domain-events';
import { Denomination } from './dtos';
import { Money } from './Money';

@Service()
export class VendorMachine {

  private balance: Money;

  @EventDispatcher()
  private eventDispatcher: EventDispatcherInterface;

  @Inject()
  private dataSource: MemoryDataSource;

  public getChangeFor(amount: number): Denomination[] {
    const changeMoney = this.balance.Allocate(amount);
    this.reduceBalance(changeMoney);
    return this.moneyToDenominations(changeMoney);
  }

  public getBalance(): Denomination[] {
    return this.moneyToDenominations(this.balance);
  }

  public reduceBalance(money: Money) {
    const oldBalance = this.balance;
    const newBalance = this.balance.subtract(money);

    this.eventDispatcher.dispatch(
      events.balance.changed,
      { oldBalance, newBalance }
    );

    this.balance = newBalance;
  }

  public loadBalance() {
    const denominations = this.dataSource.loadCoins();
    this.balance = this.denominationsToMoney(denominations);
  }

  private moneyToDenominations(money: Money): Denomination[] {
    return [
      { coin: Coin.OneCent, count: money.OneCentCount },
      { coin: Coin.TwoCents, count: money.TwoCentsCount },
      { coin: Coin.FiveCents, count: money.FiveCentsCount },
      { coin: Coin.TenCents, count: money.TenCentsCount },
      { coin: Coin.TwentyCents, count: money.TwentyCentsCount },
      { coin: Coin.FiftyCents, count: money.FiftyCentsCount },
      { coin: Coin.OneEuro, count: money.OneEuroCount },
    ];
  }

  private denominationsToMoney(denominations: Denomination[]): Money {
    return new Money(
      denominations.find(d => d.coin.isEqual(Coin.OneCent)).count,
      denominations.find(d => d.coin.isEqual(Coin.TwoCents)).count,
      denominations.find(d => d.coin.isEqual(Coin.FiveCents)).count,
      denominations.find(d => d.coin.isEqual(Coin.TenCents)).count,
      denominations.find(d => d.coin.isEqual(Coin.TwentyCents)).count,
      denominations.find(d => d.coin.isEqual(Coin.FiftyCents)).count,
      denominations.find(d => d.coin.isEqual(Coin.OneEuro)).count,
    );
  }
}
