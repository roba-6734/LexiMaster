const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://wordmaster-h00v.onrender.com'

class ApiService {
    constructor(){
        this.token = localStorage.getItem('AuthToken')

    }

    async parseJsonSafe(response){
        const text = await response.text()
        if(!text){
            return {}
        }
        try{
            return JSON.parse(text)
        }catch{
            return {_raw:text}
        }
    }

    setToken(token){
        this.token = token
        if (token){
            localStorage.setItem('AuthToken',token)
        }
        else{
            localStorage.removeItem('AuthToken')
        }
    }

    getHeaders(){
        const header = { 
            'Content-Type':'application/json'
        }
        if(this.token){
            header.Authorization = `Bearer ${this.token}`
        }
        return header

    }
    
    async login(email,password){
        console.log('inside login before fetch')
        const response= await fetch(`${API_BASE_URL}/api/auth/login`,{
            method:'POST',
            headers:this.getHeaders(),
            body:JSON.stringify({
                email,
                password
            })

        })
        const data  = await this.parseJsonSafe(response);
        console.log("we got data, this is the data")
        if (response.ok && data.access_token){
            this.setToken(data.access_token);
            console.log('we are fetching user data and it was successful')
            const currentUser = await this.getCurrentUser().catch(() => ({
                id: data.user_id
            }))

            return {
                success:true,
                user:currentUser,
                token:data.access_token
            }
        }
        else{
            throw new Error(data.detail || "Login failed, please try again")
        }

    }

    async register(email,password,display_name){
        const response = await fetch(`${API_BASE_URL}/api/auth/register`,{
            method:'POST',
            headers:this.getHeaders(),
            body: JSON.stringify({
                email,
                password,
                display_name
            })

        })

        const data = await this.parseJsonSafe(response)
        if(response.ok ){
            return {
                success:true,
                user:data
            }
        }else{
            throw new Error(data.detail || data.message || data._raw || `Registration failed (HTTP ${response.status})`)
        }

    }

    async getUserData(){
        const response = await fetch(`${API_BASE_URL}/api/auth/user`,{
            method:'GET',
            headers:this.getHeaders(),

        })
        const data = await this.parseJsonSafe(response)
        if(response.ok){
            return data
        }else{
            throw new Error(data.detail || "Failed to get user info")
        }

    }
    async getCurrentUser(){
        return this.getUserData()
    }
    async getStats(){
        try{
        const response = await fetch(`${API_BASE_URL}/api/progress/stats`,{
            headers:this.getHeaders()
        })
        const data = await this.parseJsonSafe(response)
        if(response.ok){
            return data
        }
        throw new Error(data.detail || "Failed to fetch user stats")
     }
        catch(error){
            throw new Error(error.message || "Failed to fetch user stats")
        }
        
    }
    async getWords(pageNo=1,wordPerPage=20,searchTerm=''){
        const queryParams = new URLSearchParams({
      page: pageNo,
      per_page: wordPerPage,
      search: searchTerm
    }).toString();
        try{
            console.log("Trying to get words")
            const response = await fetch(`${API_BASE_URL}/api/words?${queryParams}`,{
                method:'GET',
                headers:this.getHeaders()})
            const data = await this.parseJsonSafe(response)

            
           if (!response.ok) {
            throw new Error(data.message || data.detail || 'Error fetching words');
            }
            return data;

        }catch(error){
            console.log(error)
            throw new Error(error.message || "Failed to fetch words")
        }
    }

    async addWord(word){
        try{
            const response = await fetch(`${API_BASE_URL}/api/words/`,{
                method:'POST',
                headers:this.getHeaders(),
                body:JSON.stringify({
                    word
                })
            });
            const data = await this.parseJsonSafe(response)
            if(!response.ok){
                throw new Error(data.detail || data.message || 'Error adding word');
            }
            console.log(response)
            return data


        }catch(error){
            throw new Error(error.message || "Failed to add the word")
        }
    }
    async deleteWord(wordId){
        const response = await fetch(`${API_BASE_URL}/api/words/${wordId}`,{
            method:'DELETE',
            headers:this.getHeaders()
        })
        const data = await this.parseJsonSafe(response)
        if(response.ok){
            return data
        }
        throw new Error(data.detail || "Failed to delete word")
    }
    async updateWordProgress(wordId,difficulty){
        const isCorrect = difficulty !== 'hard'
        const response = await fetch(`${API_BASE_URL}/api/progress/review`,{
            method:'POST',
            headers:this.getHeaders(),
            body: JSON.stringify({
                word_id: wordId,
                is_correct: isCorrect,
                quiz_type: "flashcard"
            })
        })
        const data = await this.parseJsonSafe(response)
        if(response.ok){
            return data
        }
        throw new Error(data.detail || "Failed to update progress")
    }

    logout(){
        this.setToken(null)
    }


}
const apiService = new ApiService()

export default apiService
