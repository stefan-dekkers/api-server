// Validation

function emailValidation(emailAddress) {
    const regEx = /^[a-zA-Z]?\.[a-zA-Z]{2,}@([a-zA-Z]{2,}\.)+[a-zA-Z]{2,3}$/gm;
    const checkEmail = emailAddress.match(regEx);
    if (checkEmail == null) {
        throw new Error(`${emailAddress} is an invalid emailAddress`);
    }
}

function passwordValidation(password) {
    const regEx = /^(?=.*\d)(?=.*[A-Z]).{8,}$/gm;
    const checkPassword = password.match(regEx);
    if (checkPassword == null) {
        throw new Error(`${password} is an invalid password`);
    }
}

function phoneNumberValidation(phoneNumber) {
    const regEx = /^06[- ]?\d{8}$/gm;
    const checkPhoneNumber = phoneNumber.match(regEx);
    if (checkPhoneNumber == null) {
        throw new Error(`${phoneNumber} is an invalid phoneNumber`);
    }
}

module.exports = {
    emailValidation,
    passwordValidation,
    phoneNumberValidation,
};
