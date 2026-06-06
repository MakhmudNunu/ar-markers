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
const VIDEO_SRC = 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4';

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
            video.crossOrigin = 'anonymous';
            video.muted = true;
            video.playsInline = true;
            video.loop = true;
            video.style.display = 'none';
            document.body.appendChild(video);
            video.src = VIDEO_SRC;
            video.load();
            
            // События видео для отладки
            video.addEventListener('loadstart', () => console.log('Видео: начало загрузки'));
            video.addEventListener('loadedmetadata', () => console.log('Видео: метаданные загружены', video.videoWidth, 'x', video.videoHeight));
            video.addEventListener('canplay', () => console.log('Видео: можно воспроизводить'));
            video.addEventListener('play', () => console.log('Видео: воспроизведение'));
            video.addEventListener('error', (e) => console.error('Видео: ошибка загрузки', e));
            
            // Создание видео-текстуры после загрузки видео
            video.addEventListener('loadeddata', () => {
                console.log('Видео: данные загружены, создаю текстуру');
                
                // Сначала воспроизводим видео
                video.play().then(() => {
                    console.log('Видео: воспроизведение начато, создаю текстуру');
                    
                    videoTexture = new THREE.VideoTexture(video);
                    videoTexture.minFilter = THREE.LinearFilter;
                    videoTexture.magFilter = THREE.LinearFilter;
                    videoTexture.format = THREE.RGBAFormat;
                    videoTexture.encoding = THREE.sRGBEncoding;
                    
                    // Вычисляем соотношение сторон видео
                    const aspectRatio = video.videoWidth / video.videoHeight;
                    const planeWidth = 2; // Увеличим ширину
                    const planeHeight = planeWidth / aspectRatio;
                    
                    console.log('Соотношение сторон видео:', aspectRatio);
                    console.log('Размер плоскости:', planeWidth, 'x', planeHeight);
                    
                    // Создание плоскости с видео
                    const geometry = new THREE.PlaneGeometry(planeWidth, planeHeight);
                    const material = new THREE.MeshBasicMaterial({ 
                        map: videoTexture,
                        side: THREE.DoubleSide
                    });
                    const plane = new THREE.Mesh(geometry, material);
                    plane.position.set(0, 0, 0);
                    anchor.group.add(plane);
                    
                    console.log('Видео: плоскость добавлена на якорь');
                    console.log('Позиция плоскости:', plane.position.x, plane.position.y, plane.position.z);
                }).catch(e => {
                    console.error('Ошибка воспроизведения видео:', e);
                    
                    // Если видео не воспроизводится, попробуем создать плоскость с цветом для теста
                    console.log('Пробуем создать тестовую плоскость с цветом');
                    const geometry = new THREE.PlaneGeometry(1, 1);
                    const material = new THREE.MeshBasicMaterial({ 
                        color: 0x00ff00,
                        side: THREE.DoubleSide
                    });
                    const plane = new THREE.Mesh(geometry, material);
                    anchor.group.add(plane);
                });
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
                video.removeAttribute('src');
                video.remove();
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
