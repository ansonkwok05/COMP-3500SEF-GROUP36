function generate_uuid(size) {
    let uuid = "";

    let i = 0;
    while (i < size) {
        const rand = Math.floor(Math.random() * 16);
        uuid += rand.toString(16);
        i++;
    }

    return uuid;
}

module.exports = {generate_uuid};
