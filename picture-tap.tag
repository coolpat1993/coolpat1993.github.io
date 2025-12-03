<picture-tap>
  <div class="picture-tap-container">
    <div class="panel">
      <h2>Picture Tap Generator</h2>

      <input ref="fileInput" type="file" accept="image/*" onchange={ handleFileChange }>

      <label>Question / Title</label>
      <input ref="titleInput" type="text" placeholder="Tap on the Eiffel Tower" oninput={ updateGenerated }>

      <label>Extra Info</label>
      <input ref="extraInfoInput" type="text" placeholder="Optional extra info" oninput={ updateGenerated }>

      <label>Instructions</label>
      <div class="hint">Click anywhere on the canvas to add points. The last point added will appear <strong>orange and larger</strong>. Add 1 point for a dot, 2 points for a rectangle, or 3+ points for a polygon. <strong>Only one shape allowed</strong> - use Clear to start over. <strong>Editing:</strong> Click a point to drag it (Shift+Click to delete), or click a line segment to add a new point.</div>

      <label>Generated filename</label>
      <input ref="generatedInput" type="text" readonly value={ generatedFilename }>
      
      <div if={ statusMessage } class="status-message" style="margin-top:8px;padding:8px;border-radius:6px;font-size:13px;">
        { statusMessage }
      </div>

      <div style="display:flex;gap:8px;margin-top:8px">
        <button onclick={ downloadPNG }>Download PNG</button>
      </div>
    </div>

    <div>
      <div class="canvas-container">
        <canvas ref="canvas" width="640" height="920" 
          onmousedown={ handleMouseDown }
          onclick={ handleClick }
          onmousemove={ handleMouseMove }
          onmouseup={ handleMouseUp }
          onwheel={ handleWheel }
          oncontextmenu={ preventContextMenu }
          ondragenter={ handleDragEnter }
          ondragover={ handleDragOver }
          ondrop={ handleDrop }></canvas>
        <div ref="resetIcon" class="reset-icon" onclick={ resetView } title="Reset zoom and pan">🔍</div>
      </div>
      <div style="margin-top:8px;font-size:13px;color:#444">
        <div style="margin-top:8px;">
          <span style="font-size:12px;color:#666;">Scroll to zoom • Middle-click drag to pan</span>
        </div>
        <div style="margin-top:8px;display:flex;align-items:center;gap:8px;">
          <span style="font-size:12px;color:#666;">Background:</span>
          <input ref="bgColorInput" type="color" value="#222222" oninput={ handleBgColorChange } style="width:32px;height:24px;padding:0;border:1px solid #ccc;border-radius:4px;cursor:pointer;">
        </div>
        <div style="margin-top:8px;display:flex;gap:8px;">
          <button onclick={ undo } disabled={ historyIndex <= 0 } style="flex:1;padding:8px;border-radius:6px;border:1px solid #ccc;background:#f8f8f8;cursor:pointer;">Undo</button>
          <button onclick={ redo } disabled={ historyIndex >= history.length - 1 } style="flex:1;padding:8px;border-radius:6px;border:1px solid #ccc;background:#f8f8f8;cursor:pointer;">Redo</button>
        </div>
        <div style="margin-top:8px;">
          <button onclick={ clearCanvas } style="width:100%;padding:8px;border-radius:6px;border:1px solid #ccc;background:#f8f8f8;cursor:pointer;">Clear</button>
        </div>
      </div>
    </div>
  </div>

  <style>
    :host {
      display: block;
    }
    .picture-tap-container {
      display: flex;
      gap: 20px;
      padding: 20px;
      font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
    }
    .panel {
      width: 420px;
    }
    label {
      display: block;
      margin: 8px 0 4px;
      font-weight: 600;
    }
    input[type=text], select, button {
      width: 100%;
      padding: 8px;
      margin-bottom: 8px;
      border-radius: 6px;
      border: 1px solid #ccc;
    }
    button:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }
    canvas {
      background: #111;
      border-radius: 8px;
      display: block;
      width: 384px;
      height: 552px;
    }
    .hint {
      font-size: 12px;
      color: #666;
    }
    .canvas-container {
      position: relative;
      display: inline-block;
    }
    .reset-icon {
      position: absolute;
      top: 8px;
      right: 8px;
      width: 32px;
      height: 32px;
      background: #fff;
      border: 1px solid #ccc;
      border-radius: 50%;
      cursor: pointer;
      display: none;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      transition: all 0.2s;
    }
    .reset-icon:hover {
      background: #f0f0f0;
      transform: scale(1.1);
    }
    .reset-icon.visible {
      display: flex;
    }
  </style>

  <script>
    const self = this;
    
    // Initialize state
    self.canvas = null;
    self.ctx = null;
    self.img = new Image();
    self.imgLoaded = false;
    self.imageDraw = {x:0, y:0, w:640, h:920};
    self.points = [];
    self.currentShape = null;
    self.history = [];
    self.historyIndex = -1;
    self.isUndoRedoAction = false;
    self.transform = {scale: 1.0, translateX: 0, translateY: 0};
    self.isPanning = false;
    self.lastPanX = 0;
    self.lastPanY = 0;
    self.dragInfo = null;
    self.justFinishedDragging = false;
    self.mouseDownHandled = false;
    self.editMode = false;
    self.generatedFilename = '';
    self.statusMessage = '';

    self.on('mount', function() {
      self.canvas = self.refs.canvas;
      self.ctx = self.canvas.getContext('2d');

      // Initialize history with empty state
      self.saveState();
      self.updateGenerated();

      // Keyboard shortcuts for undo/redo
      document.addEventListener('keydown', self.handleKeyDown);
    });

    self.on('unmount', function() {
      document.removeEventListener('keydown', self.handleKeyDown);
    });

    // Helper functions
    self.fmtPercent = function(v) {
      return parseFloat((Math.round(v*100)/100).toFixed(2)).toString().replace(/\.00$/,'').replace(/([.][0-9])0$/,'$1');
    };

    self.sanitizeTitle = function(t) {
      return t
        .replace(/[^\w\s,\-\^]/g, '')
        .replace(/[_\.]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    self.padCoordValue = function(value) {
      const formatted = parseFloat(value).toFixed(2);
      const parts = formatted.split('.');
      const intPart = parts[0].padStart(2, '0');
      const decPart = parts[1];
      return intPart + decPart;
    };

    self.coordsToNumbers = function(coords) {
      let numberString = "";
      coords.forEach(coord => {
        const x = self.padCoordValue(coord.x);
        const y = self.padCoordValue(coord.y);
        numberString += x + y;
      });
      return numberString;
    };

    self.numbersToCoords = function(numberString) {
      const coords = [];
      for (let i = 0; i < numberString.length; i += 8) {
        const xPart = numberString.substr(i, 4);
        const yPart = numberString.substr(i + 4, 4);
        const x = parseFloat(xPart.substr(0, 2) + '.' + xPart.substr(2));
        const y = parseFloat(yPart.substr(0, 2) + '.' + yPart.substr(2));
        coords.push({x, y});
      }
      return coords;
    };

    self.updateGenerated = function() {
      const title = self.sanitizeTitle(self.refs.titleInput ? self.refs.titleInput.value : 'Your_Question');
      const extraInfo = self.refs.extraInfoInput ? self.refs.extraInfoInput.value.trim() : '';
      let allCoords = [];
      
      if(self.currentShape && self.currentShape.coords.length >= 1) {
        allCoords = self.currentShape.coords;
      }
      
      const numberString = self.coordsToNumbers(allCoords);
      let filename = `QQ_${title}_PQ${numberString}`;
      if (extraInfo) {
        filename += `_${extraInfo}`;
      }
      filename += '.png';
      self.generatedFilename = filename;
      self.update();
    };

    self.updateResetIconVisibility = function() {
      const isTransformed = self.transform.scale !== 1.0 || self.transform.translateX !== 0 || self.transform.translateY !== 0;
      if(isTransformed) {
        self.refs.resetIcon.classList.add('visible');
      } else {
        self.refs.resetIcon.classList.remove('visible');
      }
    };

    self.redraw = function() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.fillStyle = '#888888';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.ctx.save();
        this.ctx.translate(this.transform.translateX, this.transform.translateY);
        this.ctx.scale(this.transform.scale, this.transform.scale);
        
        if(this.imgLoaded) {
          this.ctx.fillStyle = this.refs.bgColorInput.value;
          this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
          this.ctx.drawImage(this.img, this.imageDraw.x, this.imageDraw.y, this.imageDraw.w, this.imageDraw.h);
        }

        // Draw current shape
        if(this.currentShape && this.currentShape.coords.length > 0) {
          this.ctx.lineWidth = 2 / this.transform.scale;
          this.ctx.strokeStyle = 'rgba(0,100,255,0.9)';
          this.ctx.fillStyle = 'rgba(0,100,255,0.9)';
          
          if(this.currentShape.coords.length === 1) {
            const c = this.toCanvasCoords(this.currentShape.coords[0]);
            this.ctx.fillStyle = 'rgba(255,100,0,0.9)';
            this.ctx.beginPath();
            this.ctx.arc(c.x, c.y, 8/this.transform.scale, 0, Math.PI*2);
            this.ctx.fill();
          } else if(this.currentShape.coords.length === 2) {
            const a = this.toCanvasCoords(this.currentShape.coords[0]);
            const b = this.toCanvasCoords(this.currentShape.coords[1]);
            this.ctx.fillStyle = 'rgba(0,100,255,0.3)';
            this.ctx.fillRect(a.x, a.y, b.x-a.x, b.y-a.y);
            this.ctx.strokeStyle = 'rgba(0,100,255,0.9)';
            this.ctx.strokeRect(a.x, a.y, b.x-a.x, b.y-a.y);
            this.ctx.fillStyle = 'rgba(0,100,255,0.9)';
            this.ctx.beginPath();
            this.ctx.arc(a.x, a.y, 5/this.transform.scale, 0, Math.PI*2);
            this.ctx.fill();
            this.ctx.fillStyle = 'rgba(255,100,0,0.9)';
            this.ctx.beginPath();
            this.ctx.arc(b.x, b.y, 8/this.transform.scale, 0, Math.PI*2);
            this.ctx.fill();
          } else {
            this.ctx.beginPath();
            const first = this.toCanvasCoords(this.currentShape.coords[0]);
            this.ctx.moveTo(first.x, first.y);
            for(let i=1; i<this.currentShape.coords.length; i++) {
              const q = this.toCanvasCoords(this.currentShape.coords[i]);
              this.ctx.lineTo(q.x, q.y);
            }
            this.ctx.closePath();
            this.ctx.fillStyle = 'rgba(0,100,255,0.2)';
            this.ctx.fill();
            this.ctx.strokeStyle = 'rgba(0,100,255,0.9)';
            this.ctx.stroke();
            
            this.currentShape.coords.forEach((coord, idx) => {
              const c = this.toCanvasCoords(coord);
              const isLast = idx === this.currentShape.coords.length - 1;
              this.ctx.fillStyle = isLast ? 'rgba(255,100,0,0.9)' : 'rgba(0,100,255,0.9)';
              const size = isLast ? 8 : 5;
              this.ctx.beginPath();
              this.ctx.arc(c.x, c.y, size/this.transform.scale, 0, Math.PI*2);
              this.ctx.fill();
            });
          }
        }
        
        this.ctx.restore();
      },

      toCanvasCoords(p) {
        const x = (p.x/100) * this.canvas.width;
        const y = (p.y/100) * this.canvas.height;
        return {x, y};
      },

      screenToCanvas(screenX, screenY) {
        const x = (screenX - this.transform.translateX) / this.transform.scale;
        const y = (screenY - this.transform.translateY) / this.transform.scale;
        return {x, y};
      },

      addPointFromCanvasPx(px, py) {
        const canvasCoords = this.screenToCanvas(px, py);
        const rx = (canvasCoords.x / this.canvas.width) * 100;
        const ry = (canvasCoords.y / this.canvas.height) * 100;
        const cx = Math.max(0, Math.min(99.99, rx));
        const cy = Math.max(0, Math.min(99.99, ry));
        return {x: parseFloat(cx.toFixed(2)), y: parseFloat(cy.toFixed(2))};
      },

      saveState() {
        if(this.isUndoRedoAction) return;
        
        const state = {
          currentShape: this.currentShape ? JSON.parse(JSON.stringify(this.currentShape)) : null
        };
        
        if(this.historyIndex < this.history.length - 1) {
          this.history = this.history.slice(0, this.historyIndex + 1);
        }
        
        this.history.push(state);
        this.historyIndex++;
        
        if(this.history.length > 50) {
          this.history.shift();
          this.historyIndex--;
        }
        
        this.update();
      },

      restoreState(state) {
        this.isUndoRedoAction = true;
        this.currentShape = state.currentShape ? JSON.parse(JSON.stringify(state.currentShape)) : null;
        this.updateGenerated();
        this.redraw();
        this.isUndoRedoAction = false;
      },

      undo() {
        if(this.historyIndex > 0) {
          this.historyIndex--;
          this.restoreState(this.history[this.historyIndex]);
          this.update();
        }
      },

      redo() {
        if(this.historyIndex < this.history.length - 1) {
          this.historyIndex++;
          this.restoreState(this.history[this.historyIndex]);
          this.update();
        }
      },

      isPointInPolygon(px, py, coords) {
        let inside = false;
        for (let i = 0, j = coords.length - 1; i < coords.length; j = i++) {
          const xi = coords[i].x, yi = coords[i].y;
          const xj = coords[j].x, yj = coords[j].y;
          const intersect = ((yi > py) !== (yj > py)) && (px < (xj - xi) * (py - yi) / (yj - yi) + xi);
          if (intersect) inside = !inside;
        }
        return inside;
      },

      isPointInRect(px, py, coord1, coord2) {
        const minX = Math.min(coord1.x, coord2.x);
        const maxX = Math.max(coord1.x, coord2.x);
        const minY = Math.min(coord1.y, coord2.y);
        const maxY = Math.max(coord1.y, coord2.y);
        return px >= minX && px <= maxX && py >= minY && py <= maxY;
      },

      distanceToLineSegment(px, py, x1, y1, x2, y2) {
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = lenSq !== 0 ? dot / lenSq : -1;
        
        let xx, yy;
        if (param < 0) {
          xx = x1; yy = y1;
        } else if (param > 1) {
          xx = x2; yy = y2;
        } else {
          xx = x1 + param * C;
          yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
      },

      findNearbyLineSegmentOnCurrentShape(px, py, threshold = 10) {
        if(!this.currentShape || this.currentShape.coords.length < 3) return null;
        
        const canvasCoords = this.screenToCanvas(px, py);
        
        for(let j = 0; j < this.currentShape.coords.length; j++) {
          const coord1 = this.currentShape.coords[j];
          const coord2 = this.currentShape.coords[(j + 1) % this.currentShape.coords.length];
          const canvasCoord1 = this.toCanvasCoords(coord1);
          const canvasCoord2 = this.toCanvasCoords(coord2);
          
          const dist = this.distanceToLineSegment(
            canvasCoords.x, canvasCoords.y,
            canvasCoord1.x, canvasCoord1.y,
            canvasCoord2.x, canvasCoord2.y
          );
          
          if(dist <= threshold / this.transform.scale) {
            return j;
          }
        }
        return null;
      },

      findNearbyLineSegmentOnRectangle(px, py, threshold = 10) {
        if(!this.currentShape || this.currentShape.coords.length !== 2) return null;
        
        const canvasCoords = this.screenToCanvas(px, py);
        const a = this.currentShape.coords[0];
        const b = this.currentShape.coords[1];
        
        const rectangleCorners = [
          a,
          {x: b.x, y: a.y},
          b,
          {x: a.x, y: b.y}
        ];
        
        for(let j = 0; j < rectangleCorners.length; j++) {
          const coord1 = rectangleCorners[j];
          const coord2 = rectangleCorners[(j + 1) % rectangleCorners.length];
          const canvasCoord1 = this.toCanvasCoords(coord1);
          const canvasCoord2 = this.toCanvasCoords(coord2);
          
          const dist = this.distanceToLineSegment(
            canvasCoords.x, canvasCoords.y,
            canvasCoord1.x, canvasCoord1.y,
            canvasCoord2.x, canvasCoord2.y
          );
          
          if(dist <= threshold / this.transform.scale) {
            return j;
          }
        }
        return null;
      },

      convertRectangleTo4Points() {
        if(!this.currentShape || this.currentShape.coords.length !== 2) return;
        
        const a = this.currentShape.coords[0];
        const b = this.currentShape.coords[1];
        
        this.currentShape.coords = [
          a,
          {x: b.x, y: a.y},
          b,
          {x: a.x, y: b.y}
        ];
      },

      parseFilename(filename) {
        const name = filename.replace(/\.png$/i, '');
        const qqMatch = name.match(/^(?:\d+)?QQ_(.+?)_PQ(\d+)(?:_(.+))?$/);
        
        if (!qqMatch) {
          console.log('Filename does not match expected format:', filename);
          return null;
        }
        
        const title = qqMatch[1];
        const numberString = qqMatch[2];
        const extraInfo = qqMatch[3] || '';
        
        if (numberString.length === 0) {
          return {title, extraInfo, coords: []};
        }
        
        if (numberString.length % 8 !== 0) {
          console.log('Invalid coordinate string length:', numberString.length);
          return {title, extraInfo, coords: []};
        }
        
        const coords = this.numbersToCoords(numberString);
        console.log('✓ Parsed filename successfully:', {title, extraInfo, coordCount: coords.length, coords});
        
        return {title, extraInfo, coords};
      },

      computeImageDraw() {
        const cw = this.canvas.width;
        const ch = this.canvas.height;
        const iw = this.img.width;
        const ih = this.img.height;
        const canvasRatio = cw / ch;
        const imgRatio = iw / ih;
        let w, h, x, y;
        
        if(imgRatio > canvasRatio) {
          w = cw;
          h = Math.round(w / imgRatio);
          x = 0;
          y = Math.round((ch-h)/2);
        } else {
          h = ch;
          w = Math.round(h * imgRatio);
          y = 0;
          x = Math.round((cw-w)/2);
        }
        this.imageDraw = {x, y, w, h};
      },

      // Event handlers
      handleFileChange(e) {
        const f = e.target.files[0];
        if(!f) return;
        
        const parsed = this.parseFilename(f.name);
        if (parsed) {
          this.refs.titleInput.value = parsed.title;
          this.refs.extraInfoInput.value = parsed.extraInfo;
          
          if (parsed.coords && parsed.coords.length > 0) {
            this.saveState();
            this.currentShape = {coords: parsed.coords};
          }
        }
        
        const url = URL.createObjectURL(f);
        this.img = new Image();
        this.img.onload = () => {
          this.imgLoaded = true;
          this.computeImageDraw();
          this.updateGenerated();
          this.redraw();
          URL.revokeObjectURL(url);
        };
        this.img.src = url;
      },

      handleMouseDown(ev) {
        if (ev.button === 1) {
          ev.preventDefault();
          this.isPanning = true;
          const rect = this.canvas.getBoundingClientRect();
          this.lastPanX = (ev.clientX - rect.left) * (this.canvas.width / rect.width);
          this.lastPanY = (ev.clientY - rect.top) * (this.canvas.height / rect.height);
          this.canvas.style.cursor = 'move';
          return;
        }

        if (ev.button !== 0) return;
        if(!this.imgLoaded) return alert('Please upload an image first');
        
        const rect = this.canvas.getBoundingClientRect();
        const px = (ev.clientX - rect.left) * (this.canvas.width / rect.width);
        const py = (ev.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.mouseDownHandled = false;
        this.editMode = ev.shiftKey;
        
        if(this.currentShape && this.currentShape.coords.length > 0) {
          for(let i = 0; i < this.currentShape.coords.length; i++) {
            const coord = this.currentShape.coords[i];
            const canvasCoord = this.toCanvasCoords(coord);
            const canvasCoords = this.screenToCanvas(px, py);
            const dist = Math.sqrt((canvasCoords.x - canvasCoord.x) ** 2 + (canvasCoords.y - canvasCoord.y) ** 2);
            if(dist <= 15 / this.transform.scale) {
              if(this.editMode) {
                this.saveState();
                this.currentShape.coords.splice(i, 1);
                this.updateGenerated();
                this.redraw();
                this.mouseDownHandled = true;
                return;
              } else {
                this.dragInfo = {coordIndex: i, isDragging: false};
                this.canvas.style.cursor = 'grabbing';
                this.justFinishedDragging = false;
                this.mouseDownHandled = true;
                return;
              }
            }
          }
          
          if(this.currentShape.coords.length === 2) {
            const nearbySegment = this.findNearbyLineSegmentOnRectangle(px, py);
            if(nearbySegment !== null) {
              this.saveState();
              this.convertRectangleTo4Points();
              const pct = this.addPointFromCanvasPx(px, py);
              const newIndex = nearbySegment + 1;
              this.currentShape.coords.splice(newIndex, 0, pct);
              this.updateGenerated();
              this.redraw();
              this.saveState();
              this.dragInfo = {coordIndex: newIndex, isDragging: false};
              this.canvas.style.cursor = 'grabbing';
              this.justFinishedDragging = false;
              this.mouseDownHandled = true;
              return;
            }
          } else if(this.currentShape.coords.length >= 3) {
            const nearbySegment = this.findNearbyLineSegmentOnCurrentShape(px, py);
            if(nearbySegment !== null) {
              this.saveState();
              const pct = this.addPointFromCanvasPx(px, py);
              const newIndex = nearbySegment + 1;
              this.currentShape.coords.splice(newIndex, 0, pct);
              this.updateGenerated();
              this.redraw();
              this.saveState();
              this.dragInfo = {coordIndex: newIndex, isDragging: false};
              this.canvas.style.cursor = 'grabbing';
              this.justFinishedDragging = false;
              this.mouseDownHandled = true;
              return;
            }
          }
          
          if(!this.editMode) {
            const canvasCoords = this.screenToCanvas(px, py);
            const percentCoords = {
              x: (canvasCoords.x / this.canvas.width) * 100,
              y: (canvasCoords.y / this.canvas.height) * 100
            };
            
            let isInsideShape = false;
            if(this.currentShape.coords.length === 2) {
              isInsideShape = this.isPointInRect(percentCoords.x, percentCoords.y, this.currentShape.coords[0], this.currentShape.coords[1]);
            } else if(this.currentShape.coords.length >= 3) {
              isInsideShape = this.isPointInPolygon(percentCoords.x, percentCoords.y, this.currentShape.coords);
            }
            
            if(isInsideShape) {
              const pct = this.addPointFromCanvasPx(px, py);
              this.dragInfo = {
                coordIndex: null,
                isDragging: false,
                isWholeShape: true,
                startPos: pct
              };
              this.canvas.style.cursor = 'move';
              this.justFinishedDragging = false;
              this.mouseDownHandled = true;
              return;
            }
          }
        }
      },

      handleClick(ev) {
        if (ev.button !== 0) return;
        if(!this.imgLoaded || this.justFinishedDragging || this.isPanning || this.editMode || this.mouseDownHandled) return;
        
        const rect = this.canvas.getBoundingClientRect();
        const px = (ev.clientX - rect.left) * (this.canvas.width / rect.width);
        const py = (ev.clientY - rect.top) * (this.canvas.height / rect.height);
        
        if(this.dragInfo && this.dragInfo.isDragging) return;
        
        if(!this.currentShape) {
          this.saveState();
          this.currentShape = {coords: []};
        } else {
          this.saveState();
        }
        
        const pct = this.addPointFromCanvasPx(px, py);
        this.currentShape.coords.push(pct);
        
        this.updateGenerated();
        this.redraw();
      },

      handleMouseMove(ev) {
        if (this.isPanning) {
          const rect = this.canvas.getBoundingClientRect();
          const currentX = (ev.clientX - rect.left) * (this.canvas.width / rect.width);
          const currentY = (ev.clientY - rect.top) * (this.canvas.height / rect.height);
          
          this.transform.translateX += currentX - this.lastPanX;
          this.transform.translateY += currentY - this.lastPanY;
          
          this.lastPanX = currentX;
          this.lastPanY = currentY;
          
          this.updateResetIconVisibility();
          this.redraw();
          return;
        }
        
        if(!this.imgLoaded) return;
        const rect = this.canvas.getBoundingClientRect();
        const px = (ev.clientX - rect.left) * (this.canvas.width / rect.width);
        const py = (ev.clientY - rect.top) * (this.canvas.height / rect.height);
        
        this.editMode = ev.shiftKey;
        
        if(this.dragInfo) {
          if(!this.dragInfo.isDragging) {
            this.dragInfo.isDragging = true;
            this.justFinishedDragging = false;
          }
          
          const pct = this.addPointFromCanvasPx(px, py);
          
          if(this.dragInfo.isWholeShape) {
            const dx = pct.x - this.dragInfo.startPos.x;
            const dy = pct.y - this.dragInfo.startPos.y;
            
            this.currentShape.coords = this.currentShape.coords.map(coord => {
              const newX = Math.max(0, Math.min(99.99, coord.x + dx));
              const newY = Math.max(0, Math.min(99.99, coord.y + dy));
              return {
                x: parseFloat(newX.toFixed(2)),
                y: parseFloat(newY.toFixed(2))
              };
            });
            
            this.dragInfo.startPos = pct;
          } else {
            this.currentShape.coords[this.dragInfo.coordIndex] = pct;
          }
          this.updateGenerated();
          this.redraw();
        } else {
          if(this.currentShape && this.currentShape.coords.length > 0) {
            let foundPoint = false;
            for(let i = 0; i < this.currentShape.coords.length; i++) {
              const coord = this.currentShape.coords[i];
              const canvasCoord = this.toCanvasCoords(coord);
              const canvasCoords = this.screenToCanvas(px, py);
              const dist = Math.sqrt((canvasCoords.x - canvasCoord.x) ** 2 + (canvasCoords.y - canvasCoord.y) ** 2);
              if(dist <= 15 / this.transform.scale) {
                this.canvas.style.cursor = this.editMode ? 'pointer' : 'grab';
                foundPoint = true;
                break;
              }
            }
            
            if(!foundPoint) {
              let nearbySegment = null;
              if(this.currentShape.coords.length === 2) {
                nearbySegment = this.findNearbyLineSegmentOnRectangle(px, py);
              } else {
                nearbySegment = this.findNearbyLineSegmentOnCurrentShape(px, py);
              }
              
              if(nearbySegment !== null) {
                this.canvas.style.cursor = 'crosshair';
              } else {
                const canvasCoords = this.screenToCanvas(px, py);
                const percentCoords = {
                  x: (canvasCoords.x / this.canvas.width) * 100,
                  y: (canvasCoords.y / this.canvas.height) * 100
                };
                
                let isInsideShape = false;
                if(this.currentShape.coords.length === 2) {
                  isInsideShape = this.isPointInRect(percentCoords.x, percentCoords.y, this.currentShape.coords[0], this.currentShape.coords[1]);
                } else if(this.currentShape.coords.length >= 3) {
                  isInsideShape = this.isPointInPolygon(percentCoords.x, percentCoords.y, this.currentShape.coords);
                }
                
                this.canvas.style.cursor = isInsideShape ? 'move' : 'default';
              }
            }
          } else {
            this.canvas.style.cursor = 'default';
          }
        }
      },

      handleMouseUp(ev) {
        if (ev.button === 1 && this.isPanning) {
          this.isPanning = false;
          this.canvas.style.cursor = 'default';
          return;
        }
        
        if(this.dragInfo) {
          if(this.dragInfo.isDragging) {
            this.saveState();
            this.justFinishedDragging = true;
            setTimeout(() => {
              this.justFinishedDragging = false;
            }, 10);
          }
          this.dragInfo = null;
          this.canvas.style.cursor = 'default';
        }
      },

      handleWheel(ev) {
        ev.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const mouseX = ev.clientX - rect.left;
        const mouseY = ev.clientY - rect.top;
        
        const canvasMouseX = mouseX * (this.canvas.width / rect.width);
        const canvasMouseY = mouseY * (this.canvas.height / rect.height);
        
        const zoomFactor = ev.deltaY > 0 ? 0.9 : 1.1;
        const newScale = Math.max(1.0, Math.min(10.0, this.transform.scale * zoomFactor));
        
        if (newScale !== this.transform.scale) {
          const scaleDiff = newScale / this.transform.scale;
          this.transform.translateX = canvasMouseX - (canvasMouseX - this.transform.translateX) * scaleDiff;
          this.transform.translateY = canvasMouseY - (canvasMouseY - this.transform.translateY) * scaleDiff;
          this.transform.scale = newScale;
          
          this.updateResetIconVisibility();
          this.redraw();
        }
      },

      handleBgColorChange() {
        this.redraw();
      },

      clearCanvas() {
        this.saveState();
        this.currentShape = null;
        this.updateGenerated();
        this.redraw();
      },

      resetView() {
        this.transform.scale = 1.0;
        this.transform.translateX = 0;
        this.transform.translateY = 0;
        this.updateResetIconVisibility();
        this.redraw();
      },

      downloadPNG() {
        if(!this.imgLoaded) return alert('Please upload an image first');
        
        const out = document.createElement('canvas');
        out.width = 640;
        out.height = 920;
        const oc = out.getContext('2d');
        
        oc.fillStyle = this.refs.bgColorInput.value;
        oc.fillRect(0, 0, out.width, out.height);
        
        const iw = this.img.width, ih = this.img.height;
        const cw = out.width, ch = out.height;
        const canvasRatio = cw/ch, imgRatio = iw/ih;
        let w, h, x, y;
        
        if(imgRatio > canvasRatio) {
          w = cw;
          h = Math.round(w/imgRatio);
          x = 0;
          y = Math.round((ch-h)/2);
        } else {
          h = ch;
          w = Math.round(h*imgRatio);
          y = 0;
          x = Math.round((cw-w)/2);
        }
        
        oc.drawImage(this.img, x, y, w, h);
        
        const data = out.toDataURL('image/png', 0.92);
        const a = document.createElement('a');
        a.href = data;
        a.download = this.generatedFilename || 'QQ_image.png';
        a.click();
      },

      handleKeyDown(e) {
        if ((e.metaKey || e.ctrlKey) && e.key === 'z' && !e.shiftKey) {
          e.preventDefault();
          this.undo();
        } else if (((e.metaKey || e.ctrlKey) && e.shiftKey && e.key === 'z') || 
                   (e.ctrlKey && e.key === 'y')) {
          e.preventDefault();
          this.redo();
        }
      },

      handleDragEnter(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      },

      handleDragOver(e) {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'copy';
      },

      handleDrop(e) {
        e.preventDefault();
        const f = e.dataTransfer.files[0];
        if(f) {
          this.refs.fileInput.files = e.dataTransfer.files;
          const ev = new Event('change');
          this.refs.fileInput.dispatchEvent(ev);
        }
      },

      preventContextMenu(e) {
        if (e.button === 1) {
          e.preventDefault();
        }
      }
  </script>
</picture-tap>
