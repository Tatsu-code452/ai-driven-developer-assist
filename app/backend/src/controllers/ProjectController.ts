import {
  Request,
  Response
} from "express";

import {
  ProjectService
} from "../services/ProjectService.js";

export class ProjectController {

  private readonly service =
    new ProjectService();

  getAll = (
    req: Request,
    res: Response
  ) => {

    const projects =
      this.service.findAll();

    return res.json({
      success: true,
      items: projects,
      totalCount:
        projects.length
    });
  };

  getById = (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        this.service.findById(
          Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
        );

      return res.json(result);

    } catch {

      return res
        .status(404)
        .json({
          message:
            "Project Not Found"
        });

    }
  };

  create = (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        this.service.create(
          req.body
        );

      return res
        .status(201)
        .json(result);

    } catch (e) {

      return res
        .status(409)
        .json({
          message:
            String(e)
        });

    }
  };

  update = (
    req: Request,
    res: Response
  ) => {

    try {

      const result =
        this.service.update(
          Array.isArray(req.params.id) ? req.params.id[0] : req.params.id,
          req.body
        );

      return res.json(result);

    } catch (e) {

      return res
        .status(400)
        .json({
          message:
            String(e)
        });

    }
  };

  delete = (
    req: Request,
    res: Response
  ) => {

    try {

      this.service.delete(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      );

      return res
        .status(204)
        .send();

    } catch {

      return res
        .status(404)
        .json({
          message:
            "Project Not Found"
        });

    }
  };

  setCurrentProject = (
    req: Request,
    res: Response
  ) => {

    this.service
      .setCurrentProject(
        Array.isArray(req.params.id) ? req.params.id[0] : req.params.id
      );

    return res.json({
      success: true
    });
  };
}
