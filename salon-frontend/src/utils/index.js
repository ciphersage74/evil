export const createPageUrl = pageName => {
  return `/${pageName.toLowerCase()}`
}

export const formatDate = date => {
  return new Date(date).toLocaleDateString('fr-FR')
}

export const formatPrice = price => {
  return `${Number(price).toFixed(2)}€`
}
