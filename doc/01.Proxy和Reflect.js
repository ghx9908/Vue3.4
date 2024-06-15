let person = {
  name: "John Doe",
  age: 20,
  get aliasName() {
    return "**" + this.name
  },
  set aliasName(value) {
    this.name = value
  },
}
const proxyPerson = new Proxy(person, {
  get(target, key, receiver) {
    console.log("获取" + key)
    // return target[key]
    //为了解决this问题，增加一层映射
    return Reflect.get(target, key)
  },
  set(target, key, value, receiver) {
    console.log("通知页面" + key + "改变了")
    // return (target[key] = value)
    return Reflect.set(target, key, value, receiver)
  },
})
console.log("=proxyPerson.aliasName>", proxyPerson.aliasName)

proxyPerson.name = "ghx"
