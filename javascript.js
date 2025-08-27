(function() {
    const progressBar = document.getElementById('loading-progress-bar');
    let progressContainer = document.getElementById('loading-progress-container');
    if (progressBar && progressContainer) {
        let progress = 0;
    const interval = setInterval(() => {
        progress += Math.random() * 10;
        if (progress > 90) progress = 90;
        progressBar.style.width = progress + '%';
    }, 200);

    window.addEventListener('load', () => {
        clearInterval(interval);
        if (progressBar) progressBar.style.width = '100%';
        setTimeout(() => {
            if (progressContainer) {
                progressContainer.style.opacity = '0';
                setTimeout(() => {
                    progressContainer.style.display = 'none';
                }, 300);
            }
        }, 500);
    });
}})();

document.addEventListener('DOMContentLoaded', function() {
    
    //加速开关
    const speedToggle = document.getElementById('speedToggle');
    const trimmer = document.getElementById('Trimmer');
    
    //提示模块
    const warningLabel = document.getElementById('warning-label');
    const generateBtn = document.querySelector('.generate-btn');
    const tabs = document.querySelectorAll('.tab');
    const debugMode = document.getElementById('debug-mode');
    //输入模块
    const base_speed = document.getElementById('base-speed');
    const y_offset = document.getElementById('y-offest');
    const alpha_input = document.getElementById('alpha');
    const x_offset = document.getElementById('x-offest');
    const const_input = document.getElementById('const');
    const luck_input = document.getElementById('luck');
    const flip_input = document.getElementById('flip');
    const offset_input = document.getElementById('offest');
    //动态模块
    const fileSection = document.getElementById('file-section');
    const infoSection = document.getElementById('info-section');
    const settingsSection = document.getElementById('settings-section');
    const downloadSection = document.getElementById('download-section');
    //文件选择
    const mldChartInput = document.getElementById('mld-chart');
    const musicFileInput = document.getElementById('music-file');
    const pictureFileInput = document.getElementById('picture-file');
    //文件信息显示
    const mldChartInfo = document.getElementById('mld-chart-info');
    const musicFileInfo = document.getElementById('music-file-info');
    const pictureFileInfo = document.getElementById('picture-file-info');
    //文件预览
    const musicPreview = document.getElementById('music-preview');
    const imagePreview = document.getElementById('image-preview');
    //轨道
    const trackControls = document.getElementById('track-controls');
    
    //加速事件
    // 初始化状态
    trimmer.disabled = !speedToggle.checked;
    // 切换事件
    speedToggle.addEventListener('change', function() {
        trimmer.disabled = !this.checked;
        // 如果关闭加速，重置为1倍速
        if (!this.checked) {
        trimmer.value = 1;
        updateChartInfo(window.chartData);
    }
    });
    
   
    

    //调试模式
    debugMode.addEventListener('change', function() {
        if (this.checked) {
            //启用,显示所有section
            infoSection.classList.add('visible');
            settingsSection.classList.add('visible');
            downloadSection.classList.add('visible');
        } else {
            // 禁用,隐藏section
            if (!mldChartInput.files[0]) {
                infoSection.classList.remove('visible');
                settingsSection.classList.remove('visible');
                downloadSection.classList.remove('visible');
            }
        }
    });

    //
    function processAudio(file, rate) {
        return new Promise((resolve, reject) => {
            if (rate === 1) {
                resolve(file);
                return;
            }
            
            const reader = new FileReader();
            reader.onload = function(e) {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                
                audioContext.decodeAudioData(e.target.result)
                    .then(audioBuffer => {
                        // 使用44100Hz采样率确保兼容性
                        const sampleRate = 44100; 
                        // 修正长度计算：原始长度 / 倍速
                        const newLength = Math.ceil(audioBuffer.length / rate);
                        const offlineContext = new OfflineAudioContext(
                            audioBuffer.numberOfChannels,
                            newLength,
                            sampleRate
                        );
                        
                        const source = offlineContext.createBufferSource();
                        source.buffer = audioBuffer;
                        source.playbackRate.value = rate;
                        source.connect(offlineContext.destination);
                        source.start();
                        
                        return offlineContext.startRendering();
                    })
                    .then(processedBuffer => {
                        // 使用16位PCM WAV格式确保最大兼容性
                        const audioData = processedBuffer.getChannelData(0);
                        const wavBlob = bufferToWave(audioData, processedBuffer.length, processedBuffer.sampleRate);
                        resolve(new File([wavBlob], file.name.replace(/\.[^.]+$/, '.wav'), { type: 'audio/wav' }));
                    })
                    .catch(error => {
                        console.warn('音频处理失败，使用原始文件:', error);
                        warningLabel.textContent = '警告：音频处理失败，使用原始文件';
                        resolve(file);
                    });
            };
            reader.onerror = () => {
                console.warn('文件读取失败，使用原始文件');
                warningLabel.textContent = '警告：文件读取失败，使用原始文件';
                resolve(file);
            };
            reader.readAsArrayBuffer(file);
        });
    }

    // 选项卡切换
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            const keyCount = parseInt(tab.getAttribute('data-keycount'));
            generateTrackInputs(keyCount);
        });
    });
    // 文件选择
    mldChartInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        window.selectedChartFile = file;

        if (file) {
            mldChartInfo.textContent = `已选择: ${file.name} (${formatFileSize(file.size)})`;
            infoSection.classList.add('visible');
            settingsSection.classList.add('visible');
            downloadSection.classList.add('visible');
            
            const reader = new FileReader();
            reader.onload = function(e) {
                try {
                    const chartData = JSON.parse(e.target.result);
                    const keyCount = chartData.meta.mode_ext.column || 4;
                    window.chartData = chartData;
                    updateChartInfo(chartData)
                    updateTabsForKeyCount(keyCount);
                    window.trackValueList = generateTrackInputs(keyCount);
                    

                } catch (error) {
                    warningLabel.textContent = '错误：无法解析谱面文件';
                    console.error('解析错误:', error);
                    return null;
                }
            };
            reader.readAsText(file);
        } else {
            mldChartInfo.textContent = '未选择文件';
        }
    });
    //音频预览
    musicFileInput.addEventListener('change', function(e) {
        if (window.selectedMusicFile) {
                URL.revokeObjectURL(window.selectedMusicFile);
            };
        const file = e.target.files[0];
        window.selectedMusicFile = file;
        if (file) {
            musicFileInfo.textContent = `已选择: ${file.name} (${formatFileSize(file.size)})`;
            musicPreview.innerHTML = '';
            if (file.type.startsWith('audio/')) {
                const audio = document.createElement('audio');
                audio.controls = true;
                audio.classList.add('audio-preview');
                audio.src = URL.createObjectURL(file);
                musicPreview.appendChild(audio);
            }
        } else {
            musicFileInfo.textContent = '未选择文件';
            musicPreview.innerHTML = '';
        }
    });
    //图片预览
    pictureFileInput.addEventListener('change', function(e) {
        if (window.selectedPictureFile) {
            URL.revokeObjectURL(window.selectedPictureFile);
        };
        const file = e.target.files[0];
        window.selectedPictureFile = file;
        if (file) {
            pictureFileInfo.textContent = `已选择: ${file.name} (${formatFileSize(file.size)})`;
            imagePreview.innerHTML = '';
            if (file.type.startsWith('image/')) {
                const img = document.createElement('img');
                img.src =  URL.createObjectURL(file);
                img.alt = '预览图片';
                const container = document.createElement('div');
                container.classList.add('preview-container');
                container.appendChild(img);
                imagePreview.appendChild(container);
            }
        } else {
            pictureFileInfo.textContent = '未选择文件';
            imagePreview.innerHTML = '';
        }
    });
      
    
    //实现谱面的转换，和zip打包
    function generateJson(chart_data){
        //
        const phi_chart = {
            "BPMList": [],
            "META":{},
            "judgeLineGroup": ["Default"],
            "judgeLineList":[{}],
            "multiLineString": "",
            "multiScale" : 1.0
        };
        
        //bpm
        //新bpm=旧bpm x Trimmer.value

        let Trimmer_value = 1;
        if(document.getElementById('speedToggle').checked){
             Trimmer_value = document.getElementById('Trimmer').value;
            }
        for(let i = 0; i <  chart_data.time.length; i++) {
            phi_chart.BPMList.push({
                "bpm" : chart_data['time'][i]['bpm'] * Trimmer_value,
                "startTime" : chart_data['time'][i]['beat']
                })
            };

        //meta
         phi_chart.META = {
            'RPEVersion':140,
            'background':window.selectedPictureFile.name,
            'charter':chart_data.meta.creator,
            'composer':chart_data.meta.song.artist,
            'id':chart_data.meta.id,
            'level':chart_data.meta.level,
            'name':chart_data.meta.song.title,
            'offset':parseInt(offset_input.value,10),
            'song': window.selectedMusicFile.name,
            };

        //judgeLineGroup
        phi_chart.judgeLineGroup = ["Default"];

        //judgeLineList
        phi_chart.judgeLineList = phi_chart.judgeLineList || [];

        phi_chart.judgeLineList[0] = {"Group":0,"Name":"Untitled","Texture":"line.png","alphaControl":[{"alpha":1.0,"easing":1,"x":0.0},{"alpha":1.0,"easing":1,"x":9999999.0}],"bpmfactor":1.0,"eventLayers":[{"alphaEvents":[{"bezier":0,"bezierPoints":[0.0,0.0,0.0,0.0],"easingLeft":0.0,"easingRight":1.0,"easingType":1,"end":255,"endTime":[1,0,1],"linkgroup":0,"start":255,"startTime":[0,0,1]}],"moveXEvents":[{"bezier":0,"bezierPoints":[0.0,0.0,0.0,0.0],"easingLeft":0.0,"easingRight":1.0,"easingType":1,"end":0.0,"endTime":[1,0,1],"linkgroup":0,"start":0.0,"startTime":[0,0,1]}],"moveYEvents":[{"bezier":0,"bezierPoints":[0.0,0.0,0.0,0.0],"easingLeft":0.0,"easingRight":1.0,"easingType":1,"end":-310.0,"endTime":[1,0,1],"linkgroup":0,"start":-310.0,"startTime":[0,0,1]}],"rotateEvents":[{"bezier":0,"bezierPoints":[0.0,0.0,0.0,0.0],"easingLeft":0.0,"easingRight":1.0,"easingType":1,"end":0.0,"endTime":[1,0,1],"linkgroup":0,"start":0.0,"startTime":[0,0,1]}],"speedEvents":[{"end":10.0,"endTime":[1,0,1],"linkgroup":0,"start":10.0,"startTime":[0,0,1]}]}],"extended":{"inclineEvents":[{"bezier":0,"bezierPoints":[0.0,0.0,0.0,0.0],"easingLeft":0.0,"easingRight":1.0,"easingType":0,"end":0.0,"endTime":[1,0,1],"linkgroup":0,"start":0.0,"startTime":[0,0,1]}]},"father":-1,"isCover":1,"notes":[],"numOfNotes":2,"posControl":[{"easing":1,"pos":1.0,"x":0.0},{"easing":1,"pos":1.0,"x":9999999.0}],"sizeControl":[{"easing":1,"size":1.0,"x":0.0},{"easing":1,"size":1.0,"x":9999999.0}],"skewControl":[{"easing":1,"skew":0.0,"x":0.0},{"easing":1,"skew":0.0,"x":9999999.0}],"yControl":[{"easing":1,"x":0.0,"y":1.0},{"easing":1,"x":9999999.0,"y":1.0}],"zOrder":0}
        
        //y_pos
        const y_pos = parseFloat(y_offset.value);
        phi_chart.judgeLineList[0].eventLayers[0].moveYEvents[0].start = y_pos;
        phi_chart.judgeLineList[0].eventLayers[0].moveYEvents[0].end = y_pos;
        
        //x_pos
        const x_pos = parseFloat(x_offset.value);
        phi_chart.judgeLineList[0].eventLayers[0].moveXEvents[0].start = x_pos;
        phi_chart.judgeLineList[0].eventLayers[0].moveXEvents[0].end = x_pos;

        //offset
        const offset = parseFloat(offset_input.value,10);
        phi_chart.META.offset = offset;

        //alpha
        const alpha = parseFloat(alpha_input.value);
        phi_chart.judgeLineList[0].eventLayers[0].alphaEvents[0].start = alpha;
        phi_chart.judgeLineList[0].eventLayers[0].alphaEvents[0].end = alpha;
                             
        //speed
        const speed = parseFloat(base_speed.value);
        phi_chart.judgeLineList[0].eventLayers[0].speedEvents[0].start = speed;
        phi_chart.judgeLineList[0].eventLayers[0].speedEvents[0].end = speed;

        //note 
        // 添加默认判定线（如果不存在)
        if(phi_chart.judgeLineList.length === 0){
            phi_chart.judgeLineList.push({
                "notes": [],
                "Group": 0,
                "Name": "Default",
                "alphaControl": [],
                "bpmfactor": 1.0,
                "eventLayers": []
            });
        };

        

        //luck
        function shuffle(arr) {
            for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
            }
            return arr;
        };

        //flip
        function mirror(arr) {
            for (let i = 0; i < arr.length; i++) {
                arr[i] = -arr[i];
            }
            return arr;
        }


        var startTime,endTime,x_position;
        console.log(`轨道列表${window.trackValueList}`);
        //随机
        if(document.getElementById('luck').checked){
            current_trackValueList = shuffle(current_trackValueList);
        }else{
            current_trackValueList = window.trackValueList;
        };
        //镜像
        if(document.getElementById('flip').checked){
            current_trackValueList = mirror(current_trackValueList);
        };

        console.log(current_trackValueList);
        for(let i = 0; i <  chart_data.note.length; i++) {
            if('type' in chart_data.note[i]){
                break;
            };
            var notetype = 0;
            current_note = chart_data.note[i];
            current_note_column = current_note['column'];
            x_position =  current_trackValueList[current_note_column];
            if('endbeat' in current_note) {
                notetype = 2;
                endTime = current_note['endbeat'];
                startTime = current_note['beat'];

            } else {
                notetype = 1;
                startTime = current_note['beat']
                endTime = startTime;
            };
            //console.log(`第${i+1}个note,轨道${current_note_column},positionX:${x_position},startTime:[${startTime}]~endTime:[${endTime}],notetype=${notetype}`)

            phi_chart.judgeLineList[0].notes[i] = { 
                "above" : 1,
                "alpha" : 255,
                "endTime" : endTime,
                "isFake" : 0,
                "positionX" : x_position,
                "size" : 1.0,
                "speed" : 1.0,
                "startTime" : startTime,
                "type" : notetype,
                "visibleTime" : 999999.0,
                "yOffset" : 0.0
            };

        };
        phi_json = JSON.stringify(phi_chart)
        return phi_json

    };
    //yml
    function generateYml(chartData){
        const info_yml = `
        id: null
        uploader: null
        name: ${window.selectedChartFile.name||'Unknown'}
        difficulty: 10.0
        level: ${chartData.meta.version || 'Hard'}
        charter: ${chartData.meta.creator || 'Unknown'}
        composer: ${chartData.meta.song.artist || 'Unknown Artist'}
    `
    return info_yml
    }



    // 生成按钮触发
    generateBtn.addEventListener('click', () => {
        console.log('JSZip available:', typeof JSZip !== 'undefined');

        if (!mldChartInput.files[0]) {
            warningLabel.textContent = '错误：未选择Malody谱面文件';
            return;
        }
        
        if (!musicFileInput.files[0]) {
            warningLabel.textContent = '错误：未选择音乐文件';
            return;
        }
        
        if (!pictureFileInput.files[0]) {
            warningLabel.textContent = '错误：未选择图片文件';
            return;
        }
        
        //生成过程
        warningLabel.textContent = '正在生成...';
        warningLabel.textContent = 'json正在生成...';
        const phi_json = generateJson(window.chartData); 
        warningLabel.textContent = 'yml正在生成...';
        const info_yml = generateYml(window.chartData)
        // 创建ZIP文件
        warningLabel.textContent = 'zip正在创建...';
        const zip = new JSZip();

        let file_format = 'zip';

        // 添加info.yml文件
        warningLabel.textContent = 'info.yml正在添加...';

        zip.file('info.yml', info_yml);

        // 添加JSON文件
        warningLabel.textContent = 'json正在添加...';

        zip.file(`${window.selectedChartFile.name}.json`, phi_json);
        
        // 添加图片文件

        warningLabel.textContent = '图片正在添加...';

        zip.file(window.selectedPictureFile.name, window.selectedPictureFile);

        // 添加音乐文件

        warningLabel.textContent = '音乐正在添加...';

        if(document.getElementById('speedToggle').checked){
            warningLabel.textContent = '音乐正在倍数处理中...';
            processAudio(window.selectedMusicFile, document.getElementById('Trimmer').value).then((processedBlob) => {
                zip.file(window.selectedMusicFile.name, processedBlob);
                console.log('音乐文件已添加到ZIP');
                generateAndDownloadZip(zip);
            });
        }else{
            zip.file(window.selectedMusicFile.name, window.selectedMusicFile);
            generateAndDownloadZip(zip);
        }

        
      
        
        // 生成ZIP并下载
        function generateAndDownloadZip(zip) {
            warningLabel.textContent = 'zip正在下载...';
            zip.generateAsync({type: 'blob'}).then(function(content) {
                const file_format = document.getElementById('rpe_mode').checked ? 'pez' : 'zip';
                const zipName = `${window.selectedChartFile.name.replace(/\.[^/.]+$/, '')}.${file_format}`;
                saveAs(content, zipName);
                warningLabel.textContent = '生成成功！';
            }).catch(function(error) {
                warningLabel.textContent = '打包失败：' + error.message;
                console.error('ZIP打包错误:', error);
            });
        }
        
    });
    
    function formatFileSize(bytes) {
        if (bytes < 1024) return bytes + ' B';
        else if (bytes < 1048576) return (bytes / 1024).toFixed(2) + ' KB';
        else return (bytes / 1048576).toFixed(2) + ' MB';
    }
    
    // 更新谱面信息
    function updateChartInfo(chartData){
        const infoElement = document.getElementById('chart-info');
        // 从chartData中提取信息
        const keyCount = chartData.meta.mode_ext.column || 4;
        const noteCount = chartData.note.length || 4;
        const creator = chartData.meta.creator || 'Unknown';
        const version = chartData.meta.version || 'Hard';
        const artist = chartData.meta.song.artist || 'Unknown Artist';
        const title = chartData.meta.song.title || 'Unknown title';
        //
        var speed = base_speed.value
        var y = y_offset.value
        var alpha = alpha_input.value
        var x = x_offset.value


        // 假设BPM和偏移值信息
        var bpm = 0
        const bpmlist = chartData.time;
        if(bpmlist.length <= 1){
            bpm=chartData.time[0].bpm
        }else{
            var max_bpm = chartData.time[0].bpm;
            var min_bpm = chartData.time[0].bpm;
            for(let i = 0; i < bpmlist.length; i++) {
                current_bpm = bpmlist[i].bpm;
                if(current_bpm > max_bpm){
                    max_bpm = current_bpm
                }else if(current_bpm < min_bpm){
                    min_bpm = current_bpm
                };
            };
            bpm = `${min_bpm}~${max_bpm}`
        }
        
        
        const offset = chartData.offset || 0;
        
        // 更新信息显示
        infoElement.textContent = 
        `
        轨道个数:    ${keyCount}
        音符总数:    ${noteCount}
        谱师:       ${creator}
        等级提示:    ${version}
        谱面名称:    ${title}
        曲师:       ${artist}
        BPM:        ${bpm}
        偏移值:      ${offset}
        基础流速:    ${speed}
        `;

        // 更新表单字段
        document.getElementById('level').value = version;
    }
    
    //根据轨道数量更新选项卡
    function updateTabsForKeyCount(keyCount) {
        tabs.forEach(tab => {
            const tabKeyCount = parseInt(tab.getAttribute('data-keycount'));
            if (tabKeyCount === keyCount) {
                tab.classList.add('active');
            } else {
                tab.classList.remove('active');
            }
        });
    }
    
    //生成轨道
    function generateTrackInputs(keyCount) {
        trackControls.innerHTML = '';
        var track_dist = 0;
        // 计算轨道位置
        if(keyCount==1){
            track_dist = 0
        }else if (keyCount==2){
            track_dist = 112.5
        }else if (keyCount==3){
            track_dist = 225
        }else if (keyCount==4){
            track_dist = 300
        }else if (keyCount==5){
            track_dist = 262.5
        }else if (keyCount==6){
            track_dist = 225
        }else if (keyCount==7){
            track_dist = 187.5
        }else if (keyCount==8){
            track_dist = 150
        }else if (keyCount==9){
            track_dist = 137.5
        };
        const centerOffset = (keyCount - 1) * track_dist / 2;
        const trackValueList = []
        for (let i = 0; i < keyCount; i++) {
            const trackValue = (i * track_dist) - centerOffset;
            trackValueList.push(trackValue);
            
            const trackItem = document.createElement('div');
            trackItem.classList.add('track-item');
            
            const label = document.createElement('label');
            label.setAttribute('for', `track${i+1}`);
            label.textContent = `轨道 ${i+1}`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.id = `track${i+1}`;
            input.value = trackValue.toFixed(1);
            input.step = '1.0';
            
            trackItem.appendChild(label);
            trackItem.appendChild(input);
            trackControls.appendChild(trackItem);
        };
        //返回轨道值列表
        return trackValueList;
    };
             
    // 绑定轨道间隔变化事件
    document.getElementById('track-dist').addEventListener('change', function() {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab) {
            const keyCount = parseInt(activeTab.getAttribute('data-keycount'));
            generateTrackInputs(keyCount);
        }
        if (window.chartData) {
            updateChartInfo(window.chartData);
        }
    });
    
    // 绑定其他输入框变化事件
    [base_speed, y_offset, alpha_input, x_offset, offset_input].forEach(input => {
        input.addEventListener('change', () => {
            if (window.chartData) {
                updateChartInfo(window.chartData);
            }
        });
    });
    // 初始化
    warningLabel.textContent = '';

    // 在页面卸载时清理
    window.addEventListener('beforeunload', function() {
    // 释放URL
    if (window.selectedMusicFile) URL.revokeObjectURL(window.selectedMusicFile);
    if (window.selectedPictureFile) URL.revokeObjectURL(window.selectedPictureFile);
    
    // 清理全局变量
    delete window.selectedChartFile;
    delete window.selectedMusicFile;
    delete window.selectedPictureFile;
    delete window.chartData;
    delete window.trackValueList;
    });
    function bufferToWave(abuffer, len, sampleRate) {
const numOfChan = 1;
const length = len * numOfChan * 2 + 44;
const buffer = new ArrayBuffer(length);
const view = new DataView(buffer);

// WAVE header
writeString(view, 0, 'RIFF');
view.setUint32(4, 36 + len * 2, true);
writeString(view, 8, 'WAVE');
writeString(view, 12, 'fmt ');
view.setUint32(16, 16, true);
view.setUint16(20, 1, true);
view.setUint16(22, numOfChan, true);
view.setUint32(24, sampleRate, true);
view.setUint32(28, sampleRate * 2 * numOfChan, true);
view.setUint16(32, numOfChan * 2, true);
view.setUint16(34, 16, true);
writeString(view, 36, 'data');
view.setUint32(40, len * 2, true);

// audio data
const volume = 1;
let index = 44;
for (let i = 0; i < len; i++) {
view.setInt16(index, abuffer[i] * (0x7FFF * volume), true);
index += 2;
}

return new Blob([view], { type: 'audio/wav' });
}

function writeString(view, offset, string) {
for (let i = 0; i < string.length; i++) {
view.setUint8(offset + i, string.charCodeAt(i));
}
}
});
