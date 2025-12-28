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