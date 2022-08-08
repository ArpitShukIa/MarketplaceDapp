from scripts.helpful_scripts import get_account
from brownie import config, network, Marketplace


def deploy():
    account = get_account()
    marketplace = Marketplace.deploy(
        {'from': account},
        publish_source=config["networks"][network.show_active()].get("verify", False)
    )
    return marketplace


def main():
    deploy()
