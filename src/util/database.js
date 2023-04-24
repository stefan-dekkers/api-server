// In memory database
let database = {
    users: [
        {
            id: 0,
            firstName: 'John',
            lastName: 'Doe',
            emailAddress: 'john.doe@example.com',
        },
        {
            id: 1,
            firstName: 'Jane',
            lastName: 'Smith',
            emailAddress: 'jane.smith@example.com',
        },
        {
            id: 2,
            firstName: 'David',
            lastName: 'Lee',
            emailAddress: 'david.lee@example.com',
        },
        {
            id: 3,
            firstName: 'Sarah',
            lastName: 'Jones',
            emailAddress: 'sarah.jones@example.com',
        },
    ],
    index: 4,
};

module.exports = database;
