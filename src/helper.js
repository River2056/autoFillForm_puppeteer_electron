const helper = {
    generateFileName: () => {
        let date = new Date();
        return `kevin_${date.getFullYear()}${date.getMonth() + 1}${date.getDate()}_${date.getHours() < 10 ? '0' + date.getHours() : date.getHours()}${date.getMinutes() < 10 ? '0' + date.getMinutes() : date.getMinutes()}`;
    }
}

module.exports = helper;