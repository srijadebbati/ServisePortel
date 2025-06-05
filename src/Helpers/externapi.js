import axios from 'axios';

const baseUrl = process.env.REACT_APP_BASEURL;
const baseUrl_new = process.env.REACT_APP_BASEURL_NEW;

const changeUrlPath = (path) => {
    console.log("URLPath: ", path);

    if (path.includes("lambdaAPI")) {
        return `${baseUrl_new}/` + path;
    } else {
        return `${baseUrl}/` + path;
    }
};


axios.interceptors.request.use(
    async (config) => {
        try {
            if (localStorage.getItem("token")) {
                config.headers.Authorization = `Bearer ${localStorage.getItem("token")}`;
            }
        } catch (error) {
            console.log('Error fetching token:', error);
        }
        return config;
    },
    (error) => Promise.reject(error)
);

const fetchData = async (urlPath, axiosBody) => {
    try {
        const config = {
            method: "POST",
            url: changeUrlPath(urlPath),
            Headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            data: axiosBody
        }
        const response = await axios(config);
       
        return response.data;

    } catch (error) {
        console.error('Error while fetching data ', error);
        return;
    }

}

const fetchAllData = async (urlPath) => {
    try {
        const config = {
            method: "GET",
            url: changeUrlPath(urlPath),
            Headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            }
        }
        // const response = await axios.get(baseUrl + urlPath);
        const response = await axios(config);
        return response.data;

    } catch (error) {
        console.error('Error while fetching data ', urlPath);
        return;
    }
}

const fetchUpdateData = async (urlPath, axiosBody) => {
    try {
        const config = {
            method: "PUT",
            url: changeUrlPath(urlPath),
            Headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            data: axiosBody
        }
        const response = await axios(config);
        return response.data;

    } catch (error) {
        console.error('Error while fetching data ', error);
        return;
    }

}

const fetchDeleteData = async (urlPath, axiosBody) => {
    try {
        const config = {
            method: "DELETE",
            url: changeUrlPath(urlPath),
            Headers: {
                "Content-Type": "application/json",
                "Access-Control-Allow-Origin": "*"
            },
            data: axiosBody
        }
        const response = await axios(config);
        return response.data;

    } catch (error) {
        console.error('Error while fetching data ', error);
        return;
    }

}

const uploadImage = async (urlPath, formData) => {
    try {
        const config = {
            method: "POST",
            url: changeUrlPath(urlPath),
            headers: {
                "Content-Type": "multipart/form-data",
                "Access-Control-Allow-Origin": "*"
            },
            data: formData, maxContentLength: 26214400, maxBodyLength: 26214400
        };

        const response = await axios(config);
        return response.data;
    } catch (error) {
        console.error('Error uploading image:', error);
        throw new Error(`Error uploading image: ${error.message}`);
    }
};

const fetchImage = async (imageUrl) => {
    try {
        const response = await fetch(imageUrl);
        if (!response.ok) {
            throw new Error('Failed to fetch image');
        }
        const blob = await response.blob();
        return URL.createObjectURL(blob);
    } catch (error) {
        console.error('Error fetching image:', error);
        throw new Error(`Error fetching image: ${error.message}`);
    }
};

export { fetchData, fetchAllData, fetchUpdateData, fetchDeleteData, uploadImage, fetchImage};