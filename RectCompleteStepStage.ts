const w : number = window.innerWidth, h : number = window.innerHeight
const nodes : number = 5

class RectCompleteStepStage {
    canvas : HTMLCanvasElement = document.createElement('canvas')
    context : CanvasRenderingContext2D
    renderer : Renderer = new Renderer()
    initCanvas() {
        this.canvas.width = w
        this.canvas.height = h
        this.context = this.canvas.getContext('2d')
        document.body.appendChild(this.canvas)
    }

    render() {
        this.context.fillStyle = '#BDBDBD'
        this.context.fillRect(0, 0, w, h)
        this.renderer.render(this.context)
    }

    handleTap() {
        this.canvas.onmousedown = () => {
            this.renderer.handleTap(() => {
                this.render()
            })
        }
    }

    static init() {
        const stage : RectCompleteStepStage = new RectCompleteStepStage()
        stage.initCanvas()
        stage.render()
        stage.handleTap()
    }
}

class State {
    scale : number = 0
    prevScale : number = 0
    dir : number = 0

    update(cb : Function) {
        this.scale += 0.05 * this.dir
        if (Math.abs(this.scale - this.prevScale) > 1) {
            this.scale = this.prevScale + this.dir
            this.dir = 0
            this.prevScale = this.scale
            cb()
        }
    }

    startUpdating(cb : Function) {
        if (this.dir == 0) {
            this.dir = 1 - 2 * this.prevScale
            cb()
        }
    }
}

class Animator {
    animated : boolean = false
    interval : number

    start(cb : Function) {
        if (!this.animated) {
            this.animated = true
            this.interval = setInterval(cb, 50)
        }
    }

    stop() {
        if (this.animated) {
            this.animated = false
            clearInterval(this.interval)
        }
    }
}

class RCSNode {
    prev : RCSNode
    next : RCSNode
    state : State = new State()

    constructor(private i : number) {
        this.addNeighbor()
    }

    addNeighbor() {
        if (this.i < nodes - 1) {
            this.next = new RCSNode(this.i + 1)
            this.next.prev = this
        }
    }

    draw(context : CanvasRenderingContext2D) {
        const gap = w / (nodes + 1)
        const size = 2 * gap / 3
        const hSize = size / 3
        context.lineCap = 'round'
        context.lineWidth = Math.min(w, h) / 60
        context.strokeStyle = 'white'
        context.save()
        context.translate(this.i * gap + gap, h/2)
        for (var j = 0; j < 2; j++) {
            const sc : number = Math.min(0.5, Math.max(0, this.state.scale - 0.5 * j)) * 2
            if (sc == 0) {
                break
            }
            const wu = size * sc, hu = hSize * sc
            context.save()
            context.scale(1 - 2 * j, 1 - 2 * j)
            context.beginPath()
            context.moveTo(-size/2, -hSize/2)
            context.lineTo(-size/2 + wu, -hSize/2)
            context.stroke()
            context.beginPath()
            context.moveTo(-size/2, -hSize/2)
            context.lineTo(-size/2, -hSize/2 + hu)
            context.stroke()
            context.restore()
        }
        context.restore()
        if (this.prev) {
            this.prev.draw(context)
        }
    }

    update(cb : Function) {
        this.state.update(cb)
    }

    startUpdating(cb : Function) {
        this.state.startUpdating(cb)
    }

    getNext(dir : number, cb : Function) : RCSNode {
        var curr : RCSNode = this.prev
        if (dir == 1) {
            curr = this.next
        }
        if (curr) {
            return curr
        }
        cb()
        return this
    }
}

class RectCompleteStep {
    curr : RCSNode = new RCSNode(0)
    dir : number = 1

    draw(context : CanvasRenderingContext2D) {
        this.curr.draw(context)
    }

    update(cb : Function) {
        this.curr.update(() => {
            this.curr = this.curr.getNext(this.dir, () => {
                this.dir *= -1
            })
            cb()
        })
    }

    startUpdating(cb : Function) {
        this.curr.startUpdating(cb)
    }
}

class Renderer {
    rcs : RectCompleteStep = new RectCompleteStep()
    animator : Animator = new Animator()

    render(context : CanvasRenderingContext2D) {
        this.rcs.draw(context)
    }

    handleTap(cb : Function) {
        this.rcs.startUpdating(() => {
            this.animator.start(() => {
                cb()
                this.rcs.update(() => {
                    this.animator.stop()
                    cb()
                })
            })
        })
    }


}
