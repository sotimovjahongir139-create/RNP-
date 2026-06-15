const Auth = {
  getToken()   { return localStorage.getItem('rnp_token'); },
  setToken(t)  { localStorage.setItem('rnp_token', t); },
  clearToken() { localStorage.removeItem('rnp_token'); },
  isLoggedIn() { return !!this.getToken(); },

  async login(username, password) {
    const data = await API.login(username, password);
    this.setToken(data.token);
    return data.user;
  },

  logout() {
    this.clearToken();
    location.reload();
  },
};
