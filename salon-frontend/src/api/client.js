import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL || '/api'

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  }
})

api.interceptors.request.use(config => {
  const token = localStorage.getItem('auth_token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const entities = {
  Prestation: {
    list: async (orderBy = 'nom') => {
      const { data } = await api.get(`/prestations?orderBy=${orderBy}`)
      return data
    },
    filter: async (filters = {}, orderBy) => {
      const params = new URLSearchParams(filters)
      if (orderBy) params.append('orderBy', orderBy)
      const { data } = await api.get(`/prestations?${params.toString()}`)
      return data
    },
    create: async payload => {
      const { data } = await api.post('/prestations', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/prestations?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/prestations?id=${id}`)
      return data
    }
  },

  Coiffeur: {
    list: async (orderBy = 'ordre') => {
      const { data } = await api.get(`/coiffeurs?orderBy=${orderBy}`)
      return data
    },
    filter: async (filters = {}, orderBy) => {
      const params = new URLSearchParams(filters)
      if (orderBy) params.append('orderBy', orderBy)
      const { data } = await api.get(`/coiffeurs?${params.toString()}`)
      return data
    },
    create: async payload => {
      const { data } = await api.post('/coiffeurs', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/coiffeurs?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/coiffeurs?id=${id}`)
      return data
    }
  },

  RendezVous: {
    list: async () => {
      const { data } = await api.get('/rendezvous')
      return data
    },
    create: async payload => {
      const { data } = await api.post('/rendezvous', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/rendezvous?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/rendezvous?id=${id}`)
      return data
    }
  },

  Avis: {
    list: async () => {
      const { data } = await api.get('/avis')
      return data
    },
    filter: async (filters = {}) => {
      const params = new URLSearchParams(filters)
      const { data } = await api.get(`/avis?${params.toString()}`)
      return data
    },
    create: async payload => {
      const { data } = await api.post('/avis', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/avis?id=${id}`, payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/avis?id=${id}`)
      return data
    }
  },

  Galerie: {
    list: async () => {
      const { data } = await api.get('/galerie')
      return data
    },
    create: async payload => {
      const { data } = await api.post('/galerie', payload)
      return data
    },
    delete: async id => {
      const { data } = await api.delete(`/galerie?id=${id}`)
      return data
    }
  },

  Configuration: {
    list: async () => {
      const { data } = await api.get('/configuration')
      return data
    },
    create: async payload => {
      const { data } = await api.post('/configuration', payload)
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/configuration?id=${id}`, payload)
      return data
    }
  },

  Horaire: {
    list: async () => {
      const { data } = await api.get('/horaires')
      return data
    },
    update: async (id, payload) => {
      const { data } = await api.put(`/horaires?id=${id}`, payload)
      return data
    }
  }
}

export const uploadFile = async file => {
  const formData = new FormData()
  formData.append('file', file)

  const { data } = await api.post('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    }
  })

  return data
}

export const auth = {
  login: async (email, password) => {
    if (email === 'admin@lesalon.fr' && password === 'admin123') {
      const token = 'admin-token'
      localStorage.setItem('auth_token', token)
      localStorage.setItem('user_email', email)
      localStorage.setItem('user_role', 'admin')
      return { token, role: 'admin', email }
    }
    throw new Error('Identifiants incorrects')
  },

  logout: () => {
    localStorage.removeItem('auth_token')
    localStorage.removeItem('user_email')
    localStorage.removeItem('user_role')
    window.location.href = '/'
  },

  me: async () => {
    const email = localStorage.getItem('user_email')
    const role = localStorage.getItem('user_role')
    if (!email) throw new Error('Non connecté')
    return { email, role }
  },

  isAuthenticated: async () => {
    return !!localStorage.getItem('auth_token')
  }
}

export default api
