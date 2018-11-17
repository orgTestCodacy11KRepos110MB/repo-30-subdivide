import React, { useEffect, useRef } from "react";
import { Pane } from "./Pane";
import { Dividers } from "./Dividers";
import AnimationFrame from "./AnimationFrame";
import {
  CHILD_ABOVE,
  CHILD_BELOW,
  CHILD_LEFT,
  CHILD_RIGHT,
  ROW,
  SW,
  NE,
  SE,
  NW
} from "../reducer/constants";

Layout.defaultProps = {
  iframeSafe: true
};

export function Layout(props) {
  const propsRef = useRef();
  propsRef.current = props;
  useEffect(() => {
    const props = propsRef.current;
    const animationFrame = new AnimationFrame();

    const { setSize } = props.actions;
    const onMouseMove = animationFrame.throttle(e => {
      const { actions, store: subdivide } = props;
      const { clientX, clientY } = e;

      if (subdivide.dividerDown) {
        e.preventDefault();
        const divider = subdivide.dividerDown;
        const {
          beforePaneId,
          afterPaneId,
          direction,
          parentSize,
          startX,
          startY
        } = divider;

        let delta = direction === ROW ? clientX - startX : clientY - startY;
        let deltaRatio = delta / parentSize;
        let afterRatio = divider.afterRatio - deltaRatio;
        let beforeRatio = divider.beforeRatio + deltaRatio;
        if (beforeRatio * parentSize > 20 && afterRatio * parentSize > 20) {
          actions.setSplitRatio(beforePaneId, beforeRatio);
          actions.setSplitRatio(afterPaneId, afterRatio);
        }
      }

      if (subdivide.cornerDown) {
        const pane = subdivide.cornerDown;
        const { split } = actions;
        const { width, height, left, top, id, corner } = pane;

        if (
          clientX > left &&
          clientX < left + width &&
          clientY > top &&
          clientY < top + height
        ) {
          if (corner === SW) {
            if (clientX - left > 25) {
              split(id, CHILD_LEFT, clientX, clientY);
            } else if (top + height - clientY > 25) {
              split(id, CHILD_BELOW, clientX, clientY);
            }
          }

          if (corner === NE) {
            if (left + width - clientX > 25) {
              split(id, CHILD_RIGHT, clientX, clientY);
            } else if (clientY - top > 25) {
              split(id, CHILD_ABOVE, clientX, clientY);
            }
          }

          if (corner === SE) {
            if (left + width - clientX > 25) {
              split(id, CHILD_RIGHT, clientX, clientY);
            } else if (top + height - clientY > 25) {
              split(id, CHILD_BELOW, clientX, clientY);
            }
          }

          if (corner === NW) {
            if (clientX - left > 25) {
              split(id, CHILD_LEFT, clientX, clientY);
            } else if (clientY - top > 25) {
              split(id, CHILD_ABOVE, clientX, clientY);
            }
          }
        }
      }
    }, []);

    function onMouseUp() {
      const { actions, store: subdivide } = props;
      if (subdivide.dividerDown) {
        actions.setDividerDown(undefined);
      }
      // give pane onMouseUp a chance to fire
      setTimeout(() => {
        if (subdivide.cornerDown) {
          actions.setCornerDown(undefined);
        }
      }, 10);
    }

    window.addEventListener("resize", () => {
      setSize(window.innerWidth, window.innerHeight);
    });

    document.addEventListener("mouseup", onMouseUp);
    document.addEventListener("mousemove", onMouseMove);

    setSize(window.innerWidth, window.innerHeight);
    return animationFrame.stop;
  }, []);

  const { store: subdivide, actions, DefaultComponent, iframeSafe } = props;
  let panes;
  if (iframeSafe) {
    panes = subdivide.allPanesIdsEver.map(id => {
      const pane = subdivide.panes[id];
      return (
        <Pane
          subdivide={subdivide}
          pane={pane}
          actions={actions}
          key={"pane" + id}
          DefaultComponent={DefaultComponent}
        />
      );
    });
  } else {
    panes = subdivide.panes
      .filter(pane => !pane.isGroup)
      .map(pane => {
        return (
          <Pane
            subdivide={subdivide}
            pane={pane}
            actions={actions}
            key={pane.id}
            DefaultComponent={DefaultComponent}
          />
        );
      });
  }

  return (
    <div>
      {panes}
      <Dividers
        dividers={subdivide.dividers}
        subdivide={subdivide}
        actions={actions}
      />
    </div>
  );
}
