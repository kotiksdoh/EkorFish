export const getInlineParams= (item: any) => {
    let result = ''
    const keys = Object.keys(item)
    keys.forEach((key, index) => {
        if(item[key] || item[key] === 0 || item[key] === false){
            result += key + '=' + item[key]
            if(index +1 !== keys.length){
                result += '&'
            }
        }
    })
    return result
  }

 export const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return (
      date.toLocaleDateString("ru-RU", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }) 
    );
  };

  export const formatPrice = (price: number) => {
    return price.toLocaleString("ru-RU", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };