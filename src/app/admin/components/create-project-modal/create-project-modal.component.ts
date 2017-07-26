import { ChangeDetectionStrategy, Component, OnInit } from '@angular/core';
import { IModalDialog, Notification } from 'gentics-ui-core';
import { Observable } from 'rxjs/Observable';
import { FormControl, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';

import { ApplicationStateService } from '../../../state/providers/application-state.service';
import { hashValues } from '../../../common/util/util';
import { SchemaResponse, ProjectCreateRequest, ProjectResponse } from '../../../common/models/server-models';
import { SchemaEffectsService } from '../../../core/providers/effects/schema-effects.service';
import { ProjectEffectsService } from '../../providers/effects/project-effects.service';
import { ApiError } from '../../../core/providers/api/api-error';

@Component({
    selector: 'create-project-modal',
    templateUrl: './create-project-modal.component.html',
    styleUrls: ['./create-project-modal.scss'],
    // changeDetection: ChangeDetectionStrategy.OnPush
})
export class CreateProjectModalComponent implements IModalDialog, OnInit {
    schemas$: Observable<SchemaResponse[]>;

    schema: FormControl;
    name: FormControl;
    form: FormGroup;

    creating: boolean = false;
    conflict: boolean = false;

    constructor(state: ApplicationStateService,
                private notification: Notification,
                private schemaEffects: SchemaEffectsService,
                private projectEffects: ProjectEffectsService) {

        this.schemas$ = state.select(state => state.entities.schema)
            .map(hashValues);

        this.name = new FormControl('', Validators.compose([Validators.required, this.conflictValidator]));
        this.schema = new FormControl('', Validators.required);

        this.form = new FormGroup({
            name: this.name,
            schema: this.schema
        });
    }

    ngOnInit(): void {
        this.schemaEffects.loadSchemas();

        this.setDefaultSchema();
    }

    /** Set folder schema as default if it exists. (It will be chosen most of the time) */
    setDefaultSchema() {
        this.schemas$
        .skipWhile(schemas => schemas.length === 0)
        .take(1)
        .subscribe(schemas => {
            const folderSchema = schemas.find(schema => schema.name === 'folder');
            if (folderSchema) {
                this.schema.setValue(folderSchema);
            }
        });
    }

    closeFn = (val: ProjectResponse) => {};
    cancelFn = (val?: any) => {};

    registerCloseFn(close: (val: ProjectResponse) => void): void {
        this.closeFn = close;
    }

    registerCancelFn(cancel: (val?: any) => void): void {
        this.cancelFn = cancel;
    }

    createProject() {
        if (this.form.valid) {
            const request: ProjectCreateRequest = {
                name: this.name.value,
                schema: {
                    uuid: this.schema.value.uuid
                }
            };

            this.form.markAsPristine();
            this.creating = true;
            this.conflict = false;
            this.projectEffects.createProject(request).then(response => {
                this.closeFn(response);
                this.creating = false;
            }).catch(err => {
                if (err instanceof ApiError && err.response && err.response.status === 409) {
                    this.conflict = true;
                    this.name.updateValueAndValidity();
                } else {
                    this.notification.show({
                        type: 'error',
                        message: err.toString()
                    });
                    console.error(JSON.stringify(err, undefined, 2));
                }
                this.creating = false;
            });
        }
    }

    private conflictValidator: (control: AbstractControl) => ValidationErrors | null = control => {
        if (control.pristine && this.conflict) {
            return {conflict: true};
        } else {
            return null;
        }
    }
}