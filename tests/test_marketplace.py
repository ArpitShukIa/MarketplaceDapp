import pytest
from brownie import exceptions

from scripts.deploy import deploy
from scripts.helpful_scripts import get_account, ether


@pytest.fixture
def marketplace():
    return deploy()


def test_name_is_correct(marketplace):
    assert marketplace.name() == "Dapp Marketplace"


def test_product_creation(marketplace):
    account = get_account()

    # Empty name
    with pytest.raises(exceptions.VirtualMachineError):
        marketplace.createProduct('', 1)

    # Invalid price
    with pytest.raises(exceptions.VirtualMachineError):
        marketplace.createProduct('Test', 0)

    tx = marketplace.createProduct('Ferrari', ether(1), {'from': account})

    assert marketplace.productCount() == 1
    assert tx.events['ProductCreated']['id'] == 1
    assert tx.events['ProductCreated']['name'] == 'Ferrari'
    assert tx.events['ProductCreated']['price'] == ether(1)
    assert tx.events['ProductCreated']['owner'] == account
    assert not tx.events['ProductCreated']['purchased']

    assert marketplace.products(1) == (1, 'Ferrari', ether(1), account, False)


def test_product_purchase(marketplace):
    seller = get_account(index=0)
    buyer = get_account(index=1)
    another_buyer = get_account(index=2)
    product_price = ether(1)
    marketplace.createProduct('Ferrari', product_price, {'from': seller})

    # Invalid product id
    with pytest.raises(exceptions.VirtualMachineError):
        marketplace.purchaseProduct(2, {'from': buyer, 'value': product_price})

    # Transferred ether less than product price
    with pytest.raises(exceptions.VirtualMachineError):
        marketplace.purchaseProduct(1, {'from': buyer, 'value': product_price - 1})

    # Buyer same as seller
    with pytest.raises(exceptions.VirtualMachineError):
        marketplace.purchaseProduct(1, {'from': seller, 'value': product_price})

    seller_initial_balance = seller.balance()
    tx = marketplace.purchaseProduct(1, {'from': buyer, 'value': product_price})

    # Owner and purchased status updated
    assert marketplace.products(1) == (1, 'Ferrari', product_price, buyer, True)

    # Seller received the amount
    assert seller.balance() == seller_initial_balance + product_price

    assert tx.events['ProductPurchased']['id'] == 1
    assert tx.events['ProductPurchased']['name'] == 'Ferrari'
    assert tx.events['ProductPurchased']['price'] == product_price
    assert tx.events['ProductPurchased']['owner'] == buyer
    assert tx.events['ProductPurchased']['purchased']

    # Can't purchase an already purchased product
    with pytest.raises(exceptions.VirtualMachineError):
        marketplace.purchaseProduct(1, {'from': another_buyer, 'value': product_price})
