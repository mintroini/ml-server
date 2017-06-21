const getDecimal = (amount) => {
    return (Number((amount - Math.floor(amount)).toFixed(2))* 100);
}

module.exports = {
  getDecimal: getDecimal
};
