// 全局变量
let mapL; // Leaflet地图
let museumMarkers = {}; // 博物馆标记
let hoveredMuseum = null; // 当前悬停的博物馆
let selectedMuseum = null; // 当前选中的博物馆
let currentYear = 1700; // 当前年份
let targetYear = 1700; // 目标年份
let yearChangeSpeed = 0.05; // 年份变化速度
let isPlaying = false; // 是否正在播放
let playSpeed = 0.3; // 播放速度
let showEurope = true; // 显示欧洲
let showNAmerica = true; // 显示北美
let showAsia = true; // 显示亚洲
let showOther = true; // 显示其他地区
let activeMuseums = []; // 当前活跃的博物馆
let recentEvents = []; // 最近的事件
let particles = []; // 粒子数组
let eventDisplayTimer = 0;
let eventDisplayText = '';
let eventDisplayAlpha = 0;
let showSplash = true;
let splashParticles = []; // 启动屏幕粒子
let splashParticleCount = 100;

// p5.js 启动屏幕设置
function setup() {
  // 创建两个画布，一个用于启动屏幕，一个用于主应用
  let mainCanvas = createCanvas(windowWidth, windowHeight);
  mainCanvas.parent('p5-container');
  
  // 设置基本参数
  frameRate(30);
  colorMode(HSB, 360, 100, 100, 1);
  textFont('Montserrat');
  noStroke();
  
  // 初始化启动屏幕粒子
  for (let i = 0; i < splashParticleCount; i++) {
    splashParticles.push({
      x: random(width),
      y: random(height/2),
      size: random(3, 8),
      speedX: random(-0.5, 0.5),
      speedY: random(-0.5, 0.5),
      color: color(random(180, 240), 70, 90, 0.6)
    });
  }
  
  // 3.5秒后自动隐藏启动屏幕
  setTimeout(function() {
    document.getElementById('splash-screen').style.opacity = 0;
    setTimeout(function() {
      document.getElementById('splash-screen').style.display = 'none';
      showSplash = false;
      // 初始化地图和UI
      initMap();
      initUI();
      // 使所有控制面板可拖动
      makeAllPanelsDraggable();
    }, 1000);
  }, 3500);
  
  // 允许点击启动屏幕直接开始
  document.getElementById('splash-screen').addEventListener('click', function() {
    this.style.opacity = 0;
    setTimeout(() => {
      this.style.display = 'none';
      showSplash = false;
      // 初始化地图和UI
      initMap();
      initUI();
      // 使所有控制面板可拖动
      makeAllPanelsDraggable();
    }, 1000);
  });
}

function draw() {
  clear(); // 清除画布，保持透明背景
  
  if (showSplash) {
    // 绘制启动屏幕动画
    drawSplashAnimation();
  } else {
    // 绘制主应用内容
    // 绘制时间线事件动画
    drawTimelineEvents();
    
    // 更新和绘制所有粒子
    updateParticles();
    
    // 如果播放中，更新年份
    if (isPlaying) {
      targetYear += playSpeed;
      if (targetYear > 2025) {
        targetYear = 2025;
        isPlaying = false;
        document.getElementById('play-pause').innerHTML = '<i class="fas fa-play"></i> Play';
      }
      
      // 平滑过渡到目标年份
      currentYear += (targetYear - currentYear) * yearChangeSpeed;
      
      document.getElementById('timeline-slider').value = Math.floor(targetYear);
      document.getElementById('time-display').textContent = Math.floor(currentYear);
      
      // 检查是否需要更新地图
      if (Math.floor(currentYear) !== Math.floor(currentYear - yearChangeSpeed * playSpeed)) {
        updateMapMarkers();
      }
    } else {
      // 即使不播放，也要平滑过渡到目标年份
      currentYear += (targetYear - currentYear) * yearChangeSpeed;
      document.getElementById('time-display').textContent = Math.floor(currentYear);
      
      // 检查是否需要更新地图
      if (Math.floor(currentYear) !== Math.floor(currentYear - yearChangeSpeed * (targetYear - currentYear))) {
        updateMapMarkers();
      }
    }
    
    // 年份变化效果
    if (Math.abs(targetYear - currentYear) > 1) {
      let yearDisplayEl = document.getElementById('year-display-large');
      yearDisplayEl.textContent = Math.floor(currentYear);
      yearDisplayEl.style.opacity = 0.3;
      
      // 如果年份变化较大，则使年份显示更醒目
      if (Math.abs(targetYear - currentYear) > 10) {
        yearDisplayEl.style.opacity = 0.6;
        yearDisplayEl.style.fontSize = '250px';
      } else {
        yearDisplayEl.style.fontSize = '200px';
      }
    } else {
      document.getElementById('year-display-large').style.opacity = 0;
    }
  }
}

// 绘制启动屏幕动画
function drawSplashAnimation() {
  // 更新和绘制粒子
  for (let i = 0; i < splashParticles.length; i++) {
    let particle = splashParticles[i];
    
    // 移动粒子
    particle.x += particle.speedX;
    particle.y += particle.speedY;
    
    // 边界检查
    if (particle.x < 0) particle.x = width;
    if (particle.x > width) particle.x = 0;
    if (particle.y < 0) particle.y = height/2;
    if (particle.y > height/2) particle.y = 0;
    
    // 绘制粒子
    noStroke();
    fill(particle.color);
    ellipse(particle.x, particle.y, particle.size);
  }
  
  // 连接附近的粒子
  stroke(210, 30, 90, 0.2);
  for (let i = 0; i < splashParticles.length; i++) {
    for (let j = i + 1; j < splashParticles.length; j++) {
      let distance = dist(
        splashParticles[i].x, splashParticles[i].y,
        splashParticles[j].x, splashParticles[j].y
      );
      
      if (distance < 100) {
        strokeWeight(1 - distance / 100);
        line(
          splashParticles[i].x, splashParticles[i].y,
          splashParticles[j].x, splashParticles[j].y
        );
      }
    }
  }
  noStroke();
}

// 窗口调整大小时重新设置画布大小
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// 存储时间轴上事件节点位置的数组
let timelineNodes = [];
// 存储鼠标悬停的节点索引
let hoveredNodeIndex = -1;

// 绘制时间线事件动画
function drawTimelineEvents() {
  // 重置时间轴节点数组
  timelineNodes = [];
  
  // 如果有选中的博物馆且有事件，绘制事件时间线
  if (selectedMuseum) {
    // 获取该博物馆的所有事件
    let museumEvents = museumTimelineData.timeline.filter(
      event => event.museum === selectedMuseum.name
    ).sort((a, b) => {
      let dateA = new Date(a.date);
      let dateB = new Date(b.date);
      return dateA - dateB;
    });
    
    if (museumEvents.length > 0) {
      // 绘制时间线容器背景 - 透明背景，细微阴影
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = 'rgba(0, 0, 0, 0.08)';
      fill(0, 0, 100, 0.6);
      rect(30, height - 160, width - 60, 100, 15);
      drawingContext.shadowBlur = 0;
      
      // 绘制时间线标题
      fill(0, 0, 0, 0.8);
      textAlign(LEFT);
      textSize(16);
      textFont('Playfair Display');
      text("Museum Timeline", 50, height - 135);
      textFont('Montserrat');
      
      // 绘制时间线轨道
      drawTimelineTrack(museumEvents);
      
      // 检测鼠标悬停和点击
      checkTimelineInteraction(museumEvents);
      
      // 如果有点击事件，处理跳转
      if (mouseIsPressed && hoveredNodeIndex !== -1) {
        let event = museumEvents[hoveredNodeIndex];
        let eventYear = new Date(event.date).getFullYear();
        targetYear = eventYear;
        document.getElementById('timeline-slider').value = eventYear;
      }
    }
  }
}

// 绘制时间线轨道和节点
function drawTimelineTrack(museumEvents) {
  // 获取时间范围
  let startDate = new Date(museumEvents[0].date);
  let endDate = new Date(museumEvents[museumEvents.length - 1].date);
  let startYear = startDate.getFullYear();
  let endYear = endDate.getFullYear();
  
  // 确保时间范围至少有10年
  endYear = endYear > startYear + 10 ? endYear : startYear + 10;
  
  // 设置时间线位置
  let trackY = height - 110;
  let trackLeft = 70;
  let trackRight = width - 70;
  let trackWidth = trackRight - trackLeft;
  
  // 绘制简洁的时间线轨道背景
  noStroke();
  fill(0, 0, 0, 0.15);
  rect(trackLeft, trackY - 1, trackWidth, 3, 2);
  
  // 绘制当前年份指示器
  let currentYearX = map(currentYear, startYear, endYear, trackLeft, trackRight);
  strokeWeight(3);
  stroke(0, 0, 0, 0.5);
  line(currentYearX, trackY - 15, currentYearX, trackY + 15);
  noStroke();
  
  // 绘制优雅的指示圆点
  fill(0, 0, 0, 0.2);
  ellipse(currentYearX, trackY, 12, 12);
  fill(0, 0, 0, 0.4);
  ellipse(currentYearX, trackY, 6, 6);
  
  // 绘制年份刻度
  let yearStep = ceil((endYear - startYear) / 10); // 约10个刻度
  yearStep = yearStep < 1 ? 1 : yearStep;
  
  textSize(12);
  textAlign(CENTER);
  
  for (let year = floor(startYear / yearStep) * yearStep; year <= endYear; year += yearStep) {
    let x = map(year, startYear, endYear, trackLeft, trackRight);
    fill(0, 0, 0, 0.15);
    rect(x, trackY - 3, 1, 8, 0);
    fill(0, 0, 0, 0.8);
    text(year, x, trackY + 20);
  }
  
  // 为每个事件绘制时间点和信息
  museumEvents.forEach((event, index) => {
    let eventDate = new Date(event.date);
    let eventYear = eventDate.getFullYear();
    let eventMonth = eventDate.getMonth();
    let eventDay = eventDate.getDate();
    let x = map(eventYear, startYear, endYear, trackLeft, trackRight);
    
    // 存储节点位置信息用于交互
    timelineNodes.push({
      x: x,
      y: trackY,
      year: eventYear,
      month: eventMonth,
      day: eventDay,
      event: event
    });
    
    // 获取事件颜色
    let colorVal;
    if (event.country === 'UK' || event.country === 'France' || event.country.includes('Europe')) {
      colorVal = color(0, 80, 80); // 欧洲 - 红色
    } else if (event.country === 'USA' || event.country === 'Canada') {
      colorVal = color(210, 80, 80); // 北美 - 蓝色
    } else if (event.country === 'Japan' || event.country === 'China' || event.country.includes('Asia')) {
      colorVal = color(120, 80, 80); // 亚洲 - 绿色
    } else {
      colorVal = color(40, 80, 80); // 其他 - 橙色
    }
    
    // 节点亮度基于与当前时间的接近度
    let proximity = map(constrain(Math.abs(eventYear - currentYear), 0, 10), 0, 10, 1, 0.5);
    let nodeSize = 8;
    
    // 如果是当前鼠标悬停的节点，突出显示
    if (index === hoveredNodeIndex) {
      nodeSize = 14;
      // 添加阴影效果
      drawingContext.shadowOffsetX = 0;
      drawingContext.shadowOffsetY = 0;
      drawingContext.shadowBlur = 15;
      drawingContext.shadowColor = color(hue(colorVal), saturation(colorVal), brightness(colorVal), 0.7);
    } else if (Math.abs(eventYear - currentYear) < 3) {
      // 接近当前年份的节点略大
      nodeSize = 12;
    }
    
    // 绘制节点外圈
    fill(255);
    ellipse(x, trackY, nodeSize + 3, nodeSize + 3);
    
    // 绘制节点
    fill(hue(colorVal), saturation(colorVal), brightness(colorVal) * proximity, 1);
    ellipse(x, trackY, nodeSize, nodeSize);
    
    // 清除阴影
    drawingContext.shadowBlur = 0;
    
    // 如果是创建事件，添加星号标记
    if (event.isFoundingEvent) {
      fill(255);
      textSize(10);
      text("★", x, trackY - 1);
    }
    
    // 如果是当前悬停的节点或者非常接近当前时间，显示详细信息
    if (index === hoveredNodeIndex || Math.abs(eventYear - currentYear) < 0.2) {
      // 调整文本位置避免重叠和超出边界
      let yOffset = -40;
      if (index % 3 === 1) yOffset = -70;
      else if (index % 3 === 2) yOffset = -100;
      
      // 距离边缘太近时调整
      let xOffset = 0;
      if (x < 150) xOffset = 100;
      else if (x > width - 150) xOffset = -100;
      
      // 创建一个更详细美观的信息气泡
      drawEventInfoBubble(event, x + xOffset, trackY + yOffset, colorVal);
      
      // 在中央显示事件通知（只对非常接近当前时间的事件）
      if (Math.abs(eventYear - currentYear) < 0.2) {
        showEventNotification(`${eventYear}: ${event.museum} - ${event.event}`);
      }
      
      // 添加一些粒子效果
      if (random() < 0.3) {
        createParticle(x, trackY, colorVal);
      }
      
      // 绘制连接线
      stroke(hue(colorVal), saturation(colorVal), brightness(colorVal), 0.5);
      strokeWeight(1);
      let lineStartY = trackY - (nodeSize/2);
      let linePath = [];
      
      // 创建贝塞尔曲线点
      let control1X = x;
      let control1Y = trackY + yOffset/3;
      let control2X = x + xOffset/2;
      let control2Y = trackY + yOffset*2/3;
      let endX = x + xOffset;
      let endY = trackY + yOffset + 20;
      
      // 绘制曲线连接线
      noFill();
      beginShape();
      vertex(x, lineStartY);
      bezierVertex(control1X, control1Y, control2X, control2Y, endX, endY);
      endShape();
      
      noStroke();
    }
  });
}

// 绘制事件信息气泡
function drawEventInfoBubble(event, x, y, colorVal) {
  let eventDate = new Date(event.date);
  let eventYear = eventDate.getFullYear();
  let eventMonth = eventDate.toLocaleString('en-US', { month: 'short' });
  let eventDay = eventDate.getDate();
  let formattedDate = `${eventMonth} ${eventDay}, ${eventYear}`;
  
  // 事件描述可能较长，需要自动换行
  let eventDesc = event.event;
  let maxWidth = 250; // 最大宽度
  textSize(14);
  let descLines = [];
  let words = eventDesc.split(' ');
  let currentLine = '';
  
  words.forEach(word => {
    let testLine = currentLine + word + ' ';
    if (textWidth(testLine) > maxWidth) {
      descLines.push(currentLine);
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  });
  if (currentLine.length > 0) {
    descLines.push(currentLine);
  }
  
  // 计算气泡高度
  let bubbleHeight = 90 + (descLines.length - 1) * 20;
  
  // 绘制气泡背景 - 更透明更精致
  drawingContext.shadowOffsetX = 0;
  drawingContext.shadowOffsetY = 0;
  drawingContext.shadowBlur = 15;
  drawingContext.shadowColor = 'rgba(0, 0, 0, 0.1)';
  
  // 主背景 - 半透明白色
  fill(0, 0,100, 0.85);
  rect(x - 140, y - 20, 280, bubbleHeight, 10);
  
  // 顶部彩色条 - 更细致的设计
  let colorHue = hue(colorVal);
  let colorSat = saturation(colorVal);
  let colorBri = brightness(colorVal);
  
  // 绘制顶部渐变条
  for (let i = 0; i < 280; i++) {
    let gradientPos = i / 280;
    let alpha = map(gradientPos, 0, 1, 0.9, 0.5);
    fill(colorHue, colorSat, colorBri, alpha);
    rect(x - 140 + i, y - 20, 1, 6, 0);
  }
  
  // 清除阴影
  drawingContext.shadowBlur = 0;
  
  // 绘制事件信息
  textAlign(LEFT);
  textSize(16);
  fill(0, 0, 0, 0.9);
  text(formattedDate, x - 120, y + 10);
  
  // 绘制事件描述（多行）
  textSize(14);
  fill(0, 0, 0, 0.8);
  for (let i = 0; i < descLines.length; i++) {
    text(descLines[i], x - 120, y + 40 + i * 20);
  }
  
  // 如果是创建事件，添加标记
  if (event.isFoundingEvent) {
    fill(colorHue, colorSat, colorBri, 0.9);
    textAlign(RIGHT);
    textSize(14);
    text("Founding Event", x + 120, y + 10);
  }
}

// 检查鼠标是否悬停在时间线节点上
function checkTimelineInteraction(museumEvents) {
  // 重置悬停状态
  hoveredNodeIndex = -1;
  
  // 检查鼠标是否在任何节点附近
  for (let i = 0; i < timelineNodes.length; i++) {
    let node = timelineNodes[i];
    let d = dist(mouseX, mouseY, node.x, node.y);
    
    if (d < 15) { // 检测半径
      hoveredNodeIndex = i;
      cursor(HAND); // 更改鼠标样式为手形
      break;
    }
  }
  
  // 如果没有悬停在任何节点上，恢复默认鼠标样式
  if (hoveredNodeIndex === -1) {
    cursor(AUTO);
  }
}

// 创建粒子
function createParticle(x, y, colorVal) {
  particles.push({
    position: createVector(x, y),
    velocity: createVector(random(-1, 1), random(-2, -0.5)),
    acceleration: createVector(0, 0.05),
    color: colorVal,
    size: random(3, 8),
    alpha: 1,
    life: random(30, 60)
  });
}

// 更新和绘制所有粒子
function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    let particle = particles[i];
    
    // 更新位置
    particle.velocity.add(particle.acceleration);
    particle.position.add(particle.velocity);
    
    // 更新生命周期
    particle.life--;
    particle.alpha = particle.life / 60;
    
    // 绘制粒子
    fill(hue(particle.color), saturation(particle.color), brightness(particle.color), particle.alpha);
    ellipse(particle.position.x, particle.position.y, particle.size, particle.size);
    
    // 移除寿命结束的粒子
    if (particle.life <= 0) {
      particles.splice(i, 1);
    }
  }
}

// 根据区域获取颜色
function getColorByRegion(country) {
  if (country === 'UK' || country === 'France' || country.includes('Europe')) {
    return '#e74c3c'; // 欧洲 - 红色
  } else if (country === 'USA' || country === 'Canada') {
    return '#3498db'; // 北美 - 蓝色
  } else if (country === 'Japan' || country === 'China' || country.includes('Asia')) {
    return '#2ecc71'; // 亚洲 - 绿色
  } else {
    return '#f39c12'; // 其他 - 橙色
  }
}

// 初始化地图
function initMap() {
  // 创建地图
  mapL = L.map('map-container').setView([30, 0], 2);
  
  // 添加可选的地图图层
  const baseMaps = {
    'Carto Light': L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
    }),
    'Carto Dark': L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://carto.com/attribution">CARTO</a>'
    }),
    'OpenStreetMap': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }),
    'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
      attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
    })
  };
  
  // 添加默认地图图层
  baseMaps['Carto Light'].addTo(mapL);
  
  // 添加图层控制按钮
  L.control.layers(baseMaps).addTo(mapL);
  
  // 初始化标记
  updateMapMarkers();
  
  // 添加地图缩放事件，更新p5画布中的位置
  mapL.on('zoomend', function() {
    updateMapMarkers();
  });
  
  mapL.on('moveend', function() {
    updateMapMarkers();
  });
}

// 更新地图上的标记
function updateMapMarkers() {
  // 清除现有标记
  for (let id in museumMarkers) {
    mapL.removeLayer(museumMarkers[id]);
  }
  museumMarkers = {};
  
  // 获取活跃的博物馆
  activeMuseums = museumTimelineData.museums.filter(museum => {
    // 检查区域过滤
    let regionVisible = true;
    if (museum.country === 'UK' || museum.country === 'France' || museum.country.includes('Europe')) {
      regionVisible = showEurope;
    } else if (museum.country === 'USA' || museum.country === 'Canada') {
      regionVisible = showNAmerica;
    } else if (museum.country === 'Japan' || museum.country === 'China' || museum.country.includes('Asia')) {
      regionVisible = showAsia;
    } else {
      regionVisible = showOther;
    }
    
    if (!regionVisible) return false;
    
    // 检查是否在当前年份前创建
    let foundingDate = new Date(museum.foundingDate);
    let foundingYear = foundingDate.getFullYear();
    return foundingYear <= currentYear;
  });
  
  // 添加博物馆标记
  activeMuseums.forEach(museum => {
    addMuseumMarker(museum);
  });
  
  // 更新最近事件
  updateRecentEvents();
}

// 添加博物馆标记
function addMuseumMarker(museum) {
  const color = getColorByRegion(museum.country);
  
  // 计算博物馆年龄影响大小
  let foundingDate = new Date(museum.foundingDate);
  let foundingYear = foundingDate.getFullYear();
  let age = currentYear - foundingYear;
  let size = Math.min(Math.max(age / 20 + 8, 8), 20);
  
  // 创建自定义图标
  const museumIcon = L.divIcon({
    className: 'museum-marker',
    html: `<div style="width:${size}px; height:${size}px; border-radius:50%; background-color:${color}; border:2px solid white; box-shadow:0 0 10px rgba(0,0,0,0.2); transition: all 0.3s ease;"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2]
  });
  
  // 添加标记
  const marker = L.marker([museum.coordinates[0], museum.coordinates[1]], {
    icon: museumIcon
  }).addTo(mapL);
  
  // 添加点击事件处理
  marker.on('click', function() {
    // 如果已经选中，则取消选中
    if (selectedMuseum && selectedMuseum.name === museum.name) {
      selectedMuseum = null;
      document.getElementById('info-panel').style.display = 'none';
      document.getElementById('recent-events').style.display = 'block';
    } else {
      selectedMuseum = museum;
      showMuseumInfo(museum);
      document.getElementById('recent-events').style.display = 'none';
    }
  });
  
  // 添加鼠标悬停事件
  marker.on('mouseover', function() {
    hoveredMuseum = museum;
    
    // 使标记稍微变大和发光
    this._icon.children[0].style.transform = 'scale(1.3)';
    this._icon.children[0].style.boxShadow = `0 0 15px ${color}`;
  });
  
  marker.on('mouseout', function() {
    hoveredMuseum = null;
    
    // 恢复原始状态
    this._icon.children[0].style.transform = 'scale(1)';
    this._icon.children[0].style.boxShadow = '0 0 10px rgba(0,0,0,0.2)';
  });
  
  // 存储标记
  museumMarkers[museum.name] = marker;
}

// 更新最近事件
function updateRecentEvents() {
  // 获取最近事件
  recentEvents = museumTimelineData.timeline
    .filter(event => {
      // 只显示活跃博物馆的事件
      return activeMuseums.some(m => m.name === event.museum);
    })
    .filter(event => {
      let eventDate = new Date(event.date);
      let eventYear = eventDate.getFullYear();
      return eventYear <= currentYear && eventYear > currentYear - 15;
    })
    .sort((a, b) => {
      let dateA = new Date(a.date);
      let dateB = new Date(b.date);
      return dateB - dateA; // 按日期从新到旧排序
    })
    .slice(0, 5); // 最近的5个事件
  
  // 更新UI显示
  const recentEventsList = document.getElementById('recent-events-list');
  recentEventsList.innerHTML = '';
  
  if (recentEvents.length === 0) {
    recentEventsList.innerHTML = '<div class="recent-event-item">No recent events</div>';
  } else {
    recentEvents.forEach(event => {
      const eventYear = new Date(event.date).getFullYear();
      
      const eventEl = document.createElement('div');
      eventEl.className = 'recent-event-item';
      eventEl.innerHTML = `
        <div>
          <span class="event-year">${eventYear}</span>
          <span class="event-museum">${event.museum}</span>
        </div>
        <div class="event-description">${event.event}</div>
      `;
      
      // 点击事件条目时聚焦到对应的博物馆
      eventEl.addEventListener('click', function() {
        const museum = museumTimelineData.museums.find(m => m.name === event.museum);
        if (museum) {
          selectedMuseum = museum;
          showMuseumInfo(museum);
          document.getElementById('recent-events').style.display = 'none';
          
          // 将地图中心移动到博物馆位置
          mapL.setView(museum.coordinates, 6);
          
          // 将时间轴设置到事件发生时间
          targetYear = eventYear;
          document.getElementById('timeline-slider').value = eventYear;
        }
      });
      
      recentEventsList.appendChild(eventEl);
    });
  }
}

// 显示博物馆信息
function showMuseumInfo(museum) {
  document.getElementById('info-panel').style.display = 'block';
  document.getElementById('museum-name').innerText = museum.name;
  
  // 找到该博物馆的创建事件
  let foundingEvent = museumTimelineData.timeline.find(
    event => event.museum === museum.name && event.isFoundingEvent
  );
  
  let infoText = `
    <strong>Location:</strong> ${museum.city}, ${museum.country}<br>
    <strong>Founded:</strong> ${museum.foundingDate}<br>
    <strong>Website:</strong> <a href="${museum.website}" target="_blank">${museum.website}</a><br>
    <strong>About:</strong> ${foundingEvent ? foundingEvent.event : "No data available"}
  `;
  
  document.getElementById('museum-info').innerHTML = infoText;
  
  // 将地图中心移动到博物馆位置
  mapL.setView(museum.coordinates, 5, {
    animate: true,
    duration: 1
  });
}

// 显示事件通知
function showEventNotification(text) {
  const notification = document.getElementById('event-notification');
  notification.textContent = text;
  notification.style.opacity = 1;
  
  // 2秒后隐藏通知
  setTimeout(() => {
    notification.style.opacity = 0;
  }, 2000);
}

// 初始化UI控件
function initUI() {
  // 时间轴滑块变化事件
  document.getElementById('timeline-slider').addEventListener('input', function() {
    targetYear = parseInt(this.value);
    document.getElementById('time-display').textContent = Math.floor(targetYear);
  });
  
  // 播放/暂停按钮点击事件
  document.getElementById('play-pause').addEventListener('click', function() {
    isPlaying = !isPlaying;
    this.innerHTML = isPlaying ? 
      '<i class="fas fa-pause"></i> Pause' : 
      '<i class="fas fa-play"></i> Play';
  });
  
  // 重置按钮点击事件
  document.getElementById('reset').addEventListener('click', function() {
    currentYear = 1700;
    targetYear = 1700;
    document.getElementById('timeline-slider').value = 1700;
    document.getElementById('time-display').textContent = 1700;
    
    // 重置选中的博物馆
    selectedMuseum = null;
    document.getElementById('info-panel').style.display = 'none';
    document.getElementById('recent-events').style.display = 'block';
    
    // 重置地图视图
    mapL.setView([30, 0], 2);
    
    updateMapMarkers();
  });
  
  // 关闭博物馆信息面板按钮
  document.getElementById('close-info').addEventListener('click', function() {
    selectedMuseum = null;
    document.getElementById('info-panel').style.display = 'none';
    document.getElementById('recent-events').style.display = 'block';
  });
  
  // 关闭最近事件面板按钮
  document.getElementById('close-events').addEventListener('click', function() {
    document.getElementById('recent-events').style.display = 'none';
  });
  
  // 显示事件面板按钮
  document.getElementById('toggle-events-btn').addEventListener('click', function() {
    const eventsPanel = document.getElementById('recent-events');
    if (eventsPanel.style.display === 'none' || eventsPanel.style.display === '') {
      eventsPanel.style.display = 'block';
      this.innerHTML = '<i class="fas fa-times"></i> Hide Events';
    } else {
      eventsPanel.style.display = 'none';
      this.innerHTML = '<i class="fas fa-history"></i> Show Events';
    }
  });
  
  // 区域过滤器变化事件
  document.getElementById('toggle-europe').addEventListener('change', function() {
    showEurope = this.checked;
    updateMapMarkers();
  });
  
  document.getElementById('toggle-namerica').addEventListener('change', function() {
    showNAmerica = this.checked;
    updateMapMarkers();
  });
  
  document.getElementById('toggle-asia').addEventListener('change', function() {
    showAsia = this.checked;
    updateMapMarkers();
  });
  
  document.getElementById('toggle-other').addEventListener('change', function() {
    showOther = this.checked;
    updateMapMarkers();
  });
}

// 使所有控制面板可拖动
function makeAllPanelsDraggable() {
  const panels = document.querySelectorAll('.control-panel');
  
  panels.forEach(panel => {
    const header = panel.querySelector('.panel-header') || panel.querySelector('.drag-handle');
    
    if (!header) return;
    
    let isDragging = false;
    let offsetX = 0, offsetY = 0;
    
    header.addEventListener('mousedown', function(e) {
      // 如果点击的是关闭按钮或其他特定元素，则不启动拖动
      if (
        e.target.tagName === 'I' && 
        (e.target.classList.contains('fa-times') || 
         e.target.tagName === 'BUTTON' || 
         e.target.tagName === 'INPUT')
      ) {
        return;
      }
      
      isDragging = true;
      
      // 记录鼠标相对于面板的位置
      const rect = panel.getBoundingClientRect();
      offsetX = e.clientX - rect.left;
      offsetY = e.clientY - rect.top;
      
      // 添加正在拖动的样式
      panel.style.transition = 'none';
      panel.style.zIndex = 1001; // 确保正在拖动的面板位于最上层
      
      document.body.style.userSelect = 'none'; // 防止选中文字
    });
    
    document.addEventListener('mousemove', function(e) {
      if (!isDragging) return;
      
      // 计算新位置
      panel.style.left = (e.clientX - offsetX) + 'px';
      panel.style.top = (e.clientY - offsetY) + 'px';
      
      // 重置一些可能影响定位的样式
      panel.style.right = 'auto';
      panel.style.bottom = 'auto';
      panel.style.transform = 'none';
      panel.style.position = 'absolute';
    });
    
    document.addEventListener('mouseup', function() {
      if (!isDragging) return;
      
      isDragging = false;
      
      // 恢复样式
      panel.style.transition = 'box-shadow 0.3s ease, transform 0.3s ease';
      document.body.style.userSelect = '';
    });
  });
}

// 修复时间轴拖拽问题
function makeTimelineControlDraggable() {
  const el = document.querySelector('.timeline-control');
  const slider = document.getElementById('timeline-slider');
  const playPauseBtn = document.getElementById('play-pause');
  const resetBtn = document.getElementById('reset');
  let isDragging = false;
  let offsetX = 0, offsetY = 0;

  el.addEventListener('mousedown', function(e) {
    // 检查鼠标点击的目标是否为滑块或其他控制按钮
    if (e.target === slider || e.target === playPauseBtn || e.target === resetBtn || 
        e.target.closest('button') !== null) {
      // 如果点击的是滑块或按钮，不启动拖动
      return;
    }
    
    isDragging = true;
    // 鼠标点下时，记录鼠标和div左上角的距离
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    el.style.transition = 'none'; // 拖动时去掉动画
    document.body.style.userSelect = 'none'; // 防止选中文字
  });

  document.addEventListener('mousemove', function(e) {
    if (isDragging) {
      el.style.left = (e.clientX - offsetX) + 'px';
      el.style.top = (e.clientY - offsetY) + 'px';
      el.style.right = 'auto'; // 防止右侧吸附
      el.style.bottom = 'auto'; // 防止底部吸附
      el.style.transform = 'none'; // 去掉原来的居中
      el.style.position = 'absolute';
    }
  });
  
  document.addEventListener('mouseup', function() {
    isDragging = false;
    document.body.style.userSelect = '';
  });
}