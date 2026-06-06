import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

// Глобальные переменные
let selectedOption = null;
let mindarThree = null;
let video = null;
let videoTexture = null;
let MINDAR = null;

// Конфигурация
const IMAGE_TARGET_SRC = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/card-example/card.mind';
const GLTF_MODEL_SRC = 'https://cdn.jsdelivr.net/gh/hiukim/mind-ar-js@1.2.5/examples/image-tracking/assets/band-example/bear/scene.gltf';
const VIDEO_SRC = 'https://ar-life-app-assets.s3.eu-north-1.amazonaws.com/ar_app_assets/videos/opt_1775731295345_1775731290735-778893170.mp4.mp4?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Content-Sha256=UNSIGNED-PAYLOAD&X-Amz-Credential=ASIARE4KGKMLPCUZUOS4%2F20260606%2Feu-north-1%2Fs3%2Faws4_request&X-Amz-Date=20260606T083500Z&X-Amz-Expires=300&X-Amz-Security-Token=IQoJb3JpZ2luX2VjELj%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FwEaCmV1LW5vcnRoLTEiRjBEAiBZjIQp0KnJQqV99qPHDH%2FEY5IQdrS0sK8YXEjaFMEh5gIgCv2Gem9WYEKfZ0KcmGJe4rbHVDtOQ%2FzXnSlmHqg9JIwq4wIIgv%2F%2F%2F%2F%2F%2F%2F%2F%2F%2FARAAGgwwNzkyMDk4NDU1MjYiDBsWvLh44r1N9%2FwtzCq3AmAJ1OZ%2BHNLf%2FiXnst%2BVVUXF8J2SX1H995NY8LXc0ysZlLSLjd%2F8TWGvOZPxgOrUwrl%2BgWHIBJMuJqKXh%2FDiBiPJr1K7Z5Kl6PK8aGRELmoUoXwUxlGA3AjfCKrtDrltQISPXItP7V1Z5b%2FThzjgsaZQLwOf6Eb%2Bs8eTj%2BB7Yl5Z7%2FASAeYmsSKnICVKrrltPYq82vH9U4gST4lld6tS3%2BvDs1kedU5FSWtx2Ov%2BMgnIuuJjEhasefFei2AlW58U%2Fs5J1HDOju3tCEuM3kIVBS1rpxwDgpEl%2BxaKtqwVisBI6XRLq2Zvlbj37LYBNahls8OYlm2H0g0G9H3yZNRUR2GYsUtXUQQwfP6v2NrF%2B%2FUMuhT4tzYgOzbzFaTv38okNJsQ0yNkZ4T0ibSTVfZlJOJhvhs8N8omMJi3j9EGOq4C%2FWTNJzol5IHevqM7ZWER6g0AXC9pSFiDZcqZHL%2BMjtnHu18A2eSw%2BEtgzc3OvltQrqEodwMvlz%2Blc3gJch7hrJ%2F7WSFawanxGrYff%2FHS1iFz5AspNdY7rkEYcQVI6qnnzQh5IIz8Rz0WEMQzjlDGvBDvb9nFrmOt%2ByqrJ3acG5m0eVGmaY2T%2FuSgFIfXk6HypzDXmnffcsPJxFSh7cJwMbCHvR76cMIYEgJ3X9SCJss49MjXZAf07BDauW46fJIIjnl%2Bixzyu3a85MXGoMhazyo2e2N2FLGn8KytxJMBmcCBz0HbeJZmdA3yjDegHr5ESui04zJ32%2BA1r%2FZA05fsS6SAOV2SWVpgXdDkfxSnuR6bd1O9tThNl3p4xtbmGEteC3m1QKC%2FknZ7oL3WcQk%3D&X-Amz-Signature=603b4e6070b934301690672645b6b0b149b3b345413124648eb2009de0b7cc3f&X-Amz-SignedHeaders=host&response-content-disposition=inline';

// Динамический импорт MindAR
async function loadMindAR() {
    try {
        const module = await import('https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image-three.prod.js');
        // MindAR может экспортировать MINDAR как default или как named export
        MINDAR = module.default || module.MINDAR || module;
        console.log('MindAR загружен успешно:', MINDAR);
    } catch (error) {
        console.error('Ошибка загрузки MindAR:', error);
    }
}

// Инициализация event listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadMindAR();
    
    document.getElementById('card-model').addEventListener('click', () => selectCard('model'));
    document.getElementById('card-video').addEventListener('click', () => selectCard('video'));
    document.getElementById('start-btn').addEventListener('click', startAR);
    document.getElementById('back-btn').addEventListener('click', stopAR);
});

// Выбор карточки
function selectCard(option) {
    selectedOption = option;
    
    // Сброс выделения
    document.getElementById('card-model').classList.remove('selected');
    document.getElementById('card-video').classList.remove('selected');
    
    // Выделение выбранной карточки
    document.getElementById(`card-${option}`).classList.add('selected');
    
    // Активация кнопки запуска
    document.getElementById('start-btn').disabled = false;
}

// Запуск AR
async function startAR() {
    if (!selectedOption) return;
    
    // Скрыть меню
    document.getElementById('menu').classList.add('hidden');
    document.getElementById('ar-container').classList.remove('hidden');
    document.getElementById('back-btn').classList.remove('hidden');
    
    try {
        // Инициализация MindAR
        mindarThree = new MINDAR.MindARThree({
            container: document.body,
            imageTargetSrc: IMAGE_TARGET_SRC
        });
        
        const { renderer, scene, camera } = mindarThree;
        
        // Настройка рендерера
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        
        // Добавление освещения
        const ambientLight = new THREE.AmbientLight(0xffffff, 1.5);
        scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 2.0);
        directionalLight.position.set(1, 2, 1);
        scene.add(directionalLight);
        
        // Создание якоря для маркера
        const anchor = mindarThree.addAnchor(0);
        
        if (selectedOption === 'model') {
            // Загрузка 3D модели
            const loader = new GLTFLoader();
            loader.load(GLTF_MODEL_SRC, (gltf) => {
                const model = gltf.scene;
                model.scale.set(0.5, 0.5, 0.5);
                model.position.set(0, 0, 0);
                anchor.group.add(model);
            }, undefined, (error) => {
                console.error('Ошибка загрузки модели:', error);
            });
        } else if (selectedOption === 'video') {
            // Создание видео
            video = document.createElement('video');
            video.src = VIDEO_SRC;
            video.muted = true;
            video.playsInline = true;
            video.loop = true;
            video.crossOrigin = 'anonymous';
            video.style.display = 'none';
            document.body.appendChild(video);
            
            // События видео для отладки
            video.addEventListener('loadstart', () => console.log('Видео: начало загрузки'));
            video.addEventListener('loadedmetadata', () => console.log('Видео: метаданные загружены', video.videoWidth, 'x', video.videoHeight));
            video.addEventListener('canplay', () => console.log('Видео: можно воспроизводить'));
            video.addEventListener('play', () => console.log('Видео: воспроизведение'));
            video.addEventListener('error', (e) => console.error('Видео: ошибка загрузки', e));
            
            // Создание видео-текстуры после загрузки видео
            video.addEventListener('loadeddata', () => {
                console.log('Видео: данные загружены, создаю текстуру');
                videoTexture = new THREE.VideoTexture(video);
                videoTexture.minFilter = THREE.LinearFilter;
                videoTexture.magFilter = THREE.LinearFilter;
                videoTexture.format = THREE.RGBFormat;
                
                // Создание плоскости с видео
                const geometry = new THREE.PlaneGeometry(1, 0.75);
                const material = new THREE.MeshBasicMaterial({ 
                    map: videoTexture,
                    transparent: true,
                    side: THREE.DoubleSide
                });
                const plane = new THREE.Mesh(geometry, material);
                anchor.group.add(plane);
                
                console.log('Видео: плоскость добавлена на якорь');
            });
            
            // События маркера
            anchor.onTargetFound = () => {
                console.log('Маркер найден, воспроизведение видео');
                if (video) {
                    video.play().catch(e => console.error('Ошибка воспроизведения:', e));
                }
            };
            
            anchor.onTargetLost = () => {
                console.log('Маркер потерян, пауза видео');
                if (video) {
                    video.pause();
                }
            };
        }
        
        // Запуск AR
        await mindarThree.start();
        
        // Обработка изменения размера окна
        window.addEventListener('resize', () => {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        });
        
    } catch (error) {
        console.error('Ошибка запуска AR:', error);
        alert('Ошибка запуска AR. Проверьте консоль для деталей.');
        stopAR();
    }
}

// Остановка AR
async function stopAR() {
    if (mindarThree) {
        try {
            await mindarThree.stop();
            
            // Очистка сцены
            const { scene } = mindarThree;
            while (scene.children.length > 0) {
                scene.remove(scene.children[0]);
            }
            
            // Остановка видео
            if (video) {
                video.pause();
                video = null;
            }
            
            if (videoTexture) {
                videoTexture.dispose();
                videoTexture = null;
            }
            
            mindarThree = null;
        } catch (error) {
            console.error('Ошибка остановки AR:', error);
        }
    }
    
    // Показать меню
    document.getElementById('menu').classList.remove('hidden');
    document.getElementById('ar-container').classList.add('hidden');
    document.getElementById('back-btn').classList.add('hidden');
    
    // Сброс выбора
    selectedOption = null;
    document.getElementById('card-model').classList.remove('selected');
    document.getElementById('card-video').classList.remove('selected');
    document.getElementById('start-btn').disabled = true;
}
