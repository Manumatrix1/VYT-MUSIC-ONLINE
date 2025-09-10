import { db } from './firebase-config.js';
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const blogPostsContainer = document.getElementById('blog-posts-container');
    
    async function loadBlogPosts() {
        if (!blogPostsContainer) return;
        blogPostsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">Cargando posts del blog...</p>';
        try {
            const q = query(collection(db, "blog"), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            
            if (querySnapshot.empty) {
                blogPostsContainer.innerHTML = '<p class="text-center text-gray-500 col-span-full">No hay posts de blog disponibles en este momento.</p>';
                return;
            }
            
            blogPostsContainer.innerHTML = '';
            querySnapshot.forEach((docItem) => {
                const post = docItem.data();
                const postElement = document.createElement('div');
                postElement.className = 'blog-post-card';
                
                let formattedDate = '';
                if (post.createdAt && post.createdAt.toDate) {
                    formattedDate = new Date(post.createdAt.toDate()).toLocaleDateString('es-AR', {
                        year: 'numeric', month: 'long', day: 'numeric'
                    });
                }

                postElement.innerHTML = `
                    ${post.imagenUrl ? `<img src="${post.imagenUrl}" alt="${post.titulo}" class="w-full h-48 object-cover">` : ''}
                    <div class="blog-post-info">
                        <h4>${post.titulo}</h4>
                        <p class="date">${formattedDate}</p>
                        <p class="snippet">${post.contenido.substring(0, 150)}...</p>
                    </div>
                `;
                blogPostsContainer.appendChild(postElement);
            });
        } catch (error) {
            console.error("Error al cargar los posts del blog:", error);
            blogPostsContainer.innerHTML = '<p class="text-center text-red-500 col-span-full">Error al cargar los posts. Por favor, inténtalo de nuevo más tarde.</p>';
        }
    }

    async function loadBasesYCondiciones() {
        const onlineContainer = document.getElementById('bases-online-content');
        const presencialContainer = document.getElementById('bases-presencial-content');

        try {
            const renderBases = async (mode, container) => {
                if (!container) return;
                const docRef = doc(db, "bases_y_condiciones", mode);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    if (data.tipo === 'pdf' && data.url) {
                        container.innerHTML = `<embed src="${data.url}" type="application/pdf" width="100%" height="800px" />`;
                    } else if (data.tipo === 'texto' && data.contenido) {
                        container.innerHTML = data.contenido.replace(/\n/g, '<br>');
                    } else {
                        container.innerHTML = '<p>Contenido no disponible.</p>';
                    }
                }
            }
            await renderBases('online', onlineContainer);
            await renderBases('presenciales', presencialContainer);
        } catch (error) {
            console.error("Error al cargar las bases y condiciones:", error);
        }
    }
    loadBlogPosts();
    loadBasesYCondiciones();
});
