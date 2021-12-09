const adyenRefusalStatus = {
	2: 'Refused: Transaction was refused.',
	3: 'Referral: Referrals',
	4: "Acquirer Error: The transaction did not go through due to an error that occurred on the acquirer's end.",
	5: 'Blocked Card: The card used for the transaction is blocked, therefore unusable.',
	6: 'Expired Card: The card used for the transaction has expired, therefore unusable.',
	7: 'Invalid Amount: An amount mismatch occurred during the transaction process.',
	8: 'Invalid Card Number: The specified card number is incorrect or invalid.',
	9: "Issuer Unavailable: It is not possible to contact the shopper's bank to authorise the transaction.",
	10: "Not supported: The shopper's bank does no tsupport or does not allow this type of transaction.",
	11: '3D Not Authenticated: 3D Secure authentication was not executed, or it did not execute successfully.',
	12: 'Not enough balance: The card does not have enough money to cover the payable amount.',
	14: 'Acquirer Fraud: Possible fraud.',
	15: 'Cancelled: The transaction was cancelled.',
	16: 'Shopper Cancelled: The shopper cancelled the transaction before completing it.',
	17: 'Invalid Pin: The specified PIN is incorrect or invalid.',
	18: 'Pin tries exceeded: The shopper specified an incorrect PIN more than three times in a row.',
	19: 'Pin validation not possible: It is not possible to validate the specified PIN number.',
	20: 'FRAUD: Possible fraud.',
	21: 'Not Submitted: The transaction was not submitted correctly for processing.',
	22: 'FRAUD-CANCELLED: The risk check flagged the transaction as fraudulent; therefore, the operation is cancelled.',
	23: 'Transaction Not Permitted',
	24: 'CVC Declined: The specified CVC is invalid.',
	25: 'Restricted Card: The card is restricted.',
	26: 'Revocation of Auth: The authorization of this card has been revoked.',
	27: 'Declined Non Generic',
	28: "Withdrawal amount exceeded: The withdrawal amount permitted for the shopper's card has been exceeded.",
	29: "Withdrawal count exceeded: The number of withdrawals permitted for the shopper's card has been exceeded.",
	31: 'Issuer Suspected Fraud: Issuer reported the transaction as suspected fraud.',
	32: 'AVS Declined: The address data the shopper entered is incorrect.',
	33: "Card requires online pin: The shopper's bank requires the shopper to enter an online PIN.",
	34: 'No checking account available on card.',
	35: 'No savings account available on card.',
	36: "Mobile pin required: The shopper's bank requires the shopper to enter a mobile PIN.",
	37: 'Contactless fallback: Attempted contactless payment and are prompted to try a different card entry method.',
	38: 'Authentication required: The issuer declined the authentication exemption request and requires authentication for the transation. Try 3DS.',
	39: 'RReq not received from DS: The shopper has not completed 3DS 2 correctly.'
};

const adyenStatics = {
	adyenRefusalStatus
};

export default adyenStatics;
